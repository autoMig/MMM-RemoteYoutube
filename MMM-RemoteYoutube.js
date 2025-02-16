Module.register("MMM-RemoteYoutube", {
    defaults: {
        debug: false,
        width: "640",
        height: "390",
        playlists: [],
        hideDelay: 2 * 60 * 1000,
        resetDelay: 30 * 60 * 1000,
        volumeFactor: 1,
        showControl: false,
        defaultVolume: 50,
        enableLoop: true,
    },

    playerIsReady: false,
    currentVolume: 0,
    hideTimer: null,
    resetTimer: null,
    currentPlaylistIndex: 0,
    playlistVideoIndices: {},

    LOCK_STRING: "MMM_REMOTEYOUTUBE",

    start: function () {
        Log.info("Starting module: " + this.name)
        if (this.config.playlists.length > 0) {
            this.loadYouTubeIframeAPI()
            this.scheduleAutoSwitches()
        } else {
            Log.error(`[${this.name}] Cannot start without at least one playlist.`)
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div")
        wrapper.id = "youtube-player"
        return wrapper
    },

    notificationReceived: function (notification, payload) {
        switch (notification) {
            case "MMM_REMOTEYOUTUBE_PLAY":
                this.playVideo()
                break
            case "MMM_REMOTEYOUTUBE_PAUSE":
                this.pauseVideo()
                break
            case "MMM_REMOTEYOUTUBE_STOP":
                this.stopPlayer()
                break
            case "MMM_REMOTEYOUTUBE_NEXT":
                this.nextVideo()
                break
            case "MMM_REMOTEYOUTUBE_PREVIOUS":
                this.previousVideo()
                break
            case "MMM_REMOTEYOUTUBE_SWITCH_PLAYLIST":
                this.switchPlaylist()
                break
            case "MMM_REMOTEYOUTUBE_INCREASE_VOLUME":
                this.increaseVolume(payload)
                break
            case "MMM_REMOTEYOUTUBE_DECREASE_VOLUME":
                this.decreaseVolume(payload)
                break
        }
    },

    playVideo: function () {
        if (this.playerIsReady) {
            clearTimeout(this.hideTimer)
            clearTimeout(this.resetTimer)

            const playerState = this.player.getPlayerState()
            if (playerState !== YT.PlayerState.PLAYING) {
                this.player.playVideo()
                if (this.config.debug) {
                    Log.info(`[${this.name}] Playing video`)
                }
            } else {
                this.player.pauseVideo()
                if (this.config.debug) {
                    Log.info(`[${this.name}] Pausing video (was playing)`)
                }

                this.handleHideWithTimeout()
                this.handleResetWithTimeout()
            }
        }
    },

    pauseVideo: function () {
        if (this.playerIsReady) {
            const playerState = this.player.getPlayerState()
            if (playerState === YT.PlayerState.PLAYING) {
                this.player.pauseVideo()
                if (this.config.debug) {
                    Log.info(`[${this.name}] Pausing video`)
                }
            } else if (this.config.debug) {
                Log.info(`[${this.name}] Video is already paused or not playing`)
            }

            this.handleHideWithTimeout()
            this.handleResetWithTimeout()
        }
    },

    stopPlayer: function () {
        if (this.playerIsReady) {
            this.player.stopVideo()
            this.currentVolume = this.config.defaultVolume
            this.player.setVolume(this.config.defaultVolume)
            this.hide(1000, { lockString: this.LOCK_STRING })
            if (this.config.debug) {
                Log.info(`[${this.name}] Stop video and hide player`)
            }
        }
    },

    nextVideo: function () {
        if (this.playerIsReady) {
            this.player.nextVideo()
            if (this.config.debug) {
                Log.info(`[${this.name}] Skipping to next video`)
            }
        }
    },

    previousVideo: function () {
        if (this.playerIsReady) {
            this.player.previousVideo()
            if (this.config.debug) {
                Log.info(`[${this.name}] Skipping to previous video`)
            }
        }
    },

    switchPlaylist: function (
        playlistIndex = (this.currentPlaylistIndex + 1) % this.config.playlists.length,
        cue = false
    ) {
        if (this.playerIsReady) {
            if (this.config.playlists.length === 0) {
                if (this.config.debug) {
                    Log.warn(`[${this.name}] No playlists configured`)
                }
                return
            }

            clearTimeout(this.hideTimer)
            clearTimeout(this.resetTimer)

            // Get the new playlist config
            const newPlaylistConfig = this.config.playlists[playlistIndex]

            // Save the current video index for the current playlist
            const currentPlaylistId = this.config.playlists[this.currentPlaylistIndex].playlistId
            this.playlistVideoIndices[currentPlaylistId] = this.player.getPlaylistIndex()

            this.player.stopVideo()
            const startIndex = this.playlistVideoIndices[newPlaylistConfig.playlistId] || 0
            const shuffle = newPlaylistConfig.shuffle !== undefined ? newPlaylistConfig.shuffle : false

            if (cue) {
                this.player.cuePlaylist({
                    listType: "playlist",
                    list: newPlaylistConfig.playlistId,
                    index: startIndex
                })
            } else {
                this.player.loadPlaylist({
                    listType: "playlist",
                    list: newPlaylistConfig.playlistId,
                    index: startIndex
                })
            }

            this.player.setShuffle(shuffle)
            this.player.setLoop(this.config.enableLoop)
            this.currentPlaylistIndex = playlistIndex
            if (this.config.debug) {
                Log.info(`[${this.name}] Switched to playlist: ${newPlaylistConfig.playlistId}`)
            }
        }
    },

    increaseVolume: function (notificationPayload) {
        if (this.playerIsReady) {
            const increaseBy = this.convertPayloadToVolume(notificationPayload)
            if (increaseBy === null) return

            let newVolume = this.currentVolume + increaseBy
            newVolume = Math.max(0, Math.min(100, newVolume))

            this.player.setVolume(newVolume)
            this.currentVolume = newVolume
            if (this.config.debug) {
                Log.info(`[${this.name}] Increased volume to: ${this.player.getVolume()}`)
            }
        }
    },

    decreaseVolume: function (notificationPayload) {
        if (this.playerIsReady) {
            const decreaseBy = this.convertPayloadToVolume(notificationPayload)
            if (decreaseBy === null) return

            let newVolume = this.currentVolume - decreaseBy
            newVolume = Math.max(0, Math.min(100, newVolume))

            this.player.setVolume(newVolume)
            this.currentVolume = newVolume
            if (this.config.debug) {
                Log.info(`[${this.name}] Decreased volume to: ${this.player.getVolume()}`)
            }
        }
    },

    convertPayloadToVolume: function (notificationPayload) {
        let payloadValue = null

        if (typeof notificationPayload === "number") {
            payloadValue = notificationPayload
        } else if (typeof notificationPayload === "object" && notificationPayload !== null && "value" in notificationPayload) {
            payloadValue = notificationPayload.value
        } else if (this.config.debug) {
            Log.warn("Unexpected notificationPayload format:", notificationPayload)
            return null
        }

        // Adjust the payload value using the volume factor, if applicable
        const adjustedValue = this.config.volumeFactor ? payloadValue / this.config.volumeFactor : payloadValue
        return Math.round(adjustedValue)
    },

    loadYouTubeIframeAPI: function () {
        var tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        var firstScriptTag = document.getElementsByTagName("script")[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        window.onYouTubeIframeAPIReady = this.onYouTubeIframeAPIReady.bind(this)
    },

    onYouTubeIframeAPIReady: function () {
        const initialPlaylistConfig = this.config.playlists[0]

        this.player = new YT.Player("youtube-player", {
            width: this.config.width,
            height: this.config.height,
            playerVars: {
                listType: "playlist",
                list: initialPlaylistConfig.playlistId,
                controls: this.config.showControl,
            },
            events: {
                onReady: () => this.onPlayerReady(initialPlaylistConfig),
                onStateChange: this.handleVideoStateChange.bind(this)
            }
        })
    },

    onPlayerReady: function (initialPlaylistConfig) {
        this.playerIsReady = true
        this.player.setLoop(this.config.enableLoop)
        this.player.setShuffle(initialPlaylistConfig.shuffle !== undefined ? initialPlaylistConfig.shuffle : false)
        this.player.setVolume(this.config.defaultVolume)
        this.currentVolume = this.config.defaultVolume

        if (this.config.debug) {
            Log.info(`[${this.name}] YouTube player is ready`)
        }
    },

    handleVideoStateChange: function (event) {
        if (event.data === YT.PlayerState.PLAYING) {
            if (this.hidden) {
                this.show(500, { lockString: this.LOCK_STRING })
            }

            const currentPlaylistId = this.config.playlists[this.currentPlaylistIndex].playlistId
            this.playlistVideoIndices[currentPlaylistId] = this.player.getPlaylistIndex()
        }
    },

    handleHideWithTimeout: function () {
        if (this.config.hideDelay !== 0 && !this.hidden) {
            this.hideTimer = setTimeout(() => {
                this.hide(500, { lockString: this.LOCK_STRING })
            }, this.config.hideDelay)
        }
    },

    handleResetWithTimeout: function () {
        if (this.config.resetDelay) {
            const playerHasPlayingOrPausedVideo = this.playerIsReady
              && (this.player.getPlayerState() === YT.PlayerState.PLAYING || this.player.getPlayerState() === YT.PlayerState.PAUSED)
            const playerHasChangedVolume = this.config.defaultVolume !== this.currentVolume

            if (playerHasPlayingOrPausedVideo || playerHasChangedVolume) {
                this.resetTimer = setTimeout(() => {
                    this.currentVolume = this.config.defaultVolume
                    this.player.setVolume(this.config.defaultVolume)
                    this.player.stopVideo()
                }, this.config.resetDelay)
            }
        }
    },

    scheduleAutoSwitches: function () {
        this.config.playlists.forEach((playlistConfig, index) => {
            if (playlistConfig.autoSwitchTime) {
                this.scheduleAutoSwitch(playlistConfig.autoSwitchTime, index)
            }
        })
    },

    scheduleAutoSwitch: function (time, playlistIndex) {
        const now = new Date()
        const [hours, minutes] = time.split(":").map(Number)
        const switchTime = new Date()
        switchTime.setHours(hours, minutes, 0, 0)

        if (switchTime <= now) {
            switchTime.setDate(switchTime.getDate() + 1)
        }

        const timeUntilSwitch = switchTime - now
        if (this.config.debug) {
            Log.info(`[${this.name}] Scheduling autoswitch for playlist ${playlistIndex} at ${time} (${timeUntilSwitch}ms from now)`)
        }

        setTimeout(() => {
            if (this.playerIsReady && this.player.getPlayerState() !== YT.PlayerState.PLAYING) {
                this.switchPlaylist(playlistIndex, true)
            }
            this.scheduleAutoSwitch(time, playlistIndex)
        }, timeUntilSwitch)
    }
})
