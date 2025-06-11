# MMM-RemoteYoutube

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/) that allows you to play YouTube videos and playlists using notifications.

![Example of MMM-RemoteYoutube](./images/screen.png)

The player uses the YouTube iFrame API. For more information, see [YouTube iFrame API Reference](https://developers.google.com/youtube/iframe_api_reference).

### Features

- Play YouTube videos from given playlists
- Control playback (play, pause, stop, next, previous)
- Switch between multiple playlists
- Adjust volume
- Auto-hide when paused (configurable)
- Shuffle and loop options

## Installation

In your terminal, go to your MagicMirror² Module folder, clone MMM-RemoteYoutube, and install its dependencies:

   ```bash
   cd ~/MagicMirror/modules
   git clone https://github.com/DreamyChloe/MMM-RemoteYoutube.git
   cd MMM-RemoteYoutube
   npm install
   ```

### Update

To update the module, navigate to the module's folder, pull the latest changes, and reinstall dependencies:

```bash
cd ~/MagicMirror/modules/MMM-RemoteYoutube
git pull
npm install
```

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:

```js
{
    module: 'MMM-RemoteYoutube',
    position: 'bottom_right',
    config: {
        debug: true,
        width: "640",
        height: "390",
        playlists: [
            {
                playlistId: "YOUR_PLAYLIST_ID_1",
                shuffle: true,
                autoSwitchTime: "7:00"
            },
            {
                playlistId: "YOUR_PLAYLIST_ID_2",
                autoSwitchTime: "19:00"
            },
            {
                playlistId: "YOUR_PLAYLIST_ID_3",
            }
        ],
        hideDelay: 120000,  // 2 minutes
        resetDelay: 1800000, // 30 minutes
        volumeFactor: 1,
        showControl: false,
        defaultVolume: 50,
        enableLoop: true
    }
}
```

### Configuration Options

| Option          | Required | Default | Description                                                                                                  |
|-----------------|----------|---------|--------------------------------------------------------------------------------------------------------------|
| `debug`         | No       | false   | Enable debug logging                                                                                         |
| `width`         | No       | "640"   | Width of the YouTube player                                                                                  |
| `height`        | No       | "390"   | Height of the YouTube player                                                                                 |
| `playlists`     | Yes      | []      | Array of playlist objects containing playlistId, shuffle, and autoSwitchTime                                 |
| `hideDelay`     | No       | 120000  | Time in milliseconds to wait before hiding the player when paused (set to 0 to disable)                      |
| `resetDelay`    | No       | 1800000 | Time in milliseconds to wait before resetting the current volume and video when paused (set to 0 to disable) |
| `volumeFactor`  | No       | 1       | Factor to adjust volume changes (default: 1)                                                                 |
| `showControl`   | No       | false   | Whether to show YouTube player controls                                                                      |
| `defaultVolume` | No       | 50      | Default volume level (0-100)                                                                                 |
| `enableLoop`    | No       | true    | Whether to loop playlists                                                                                    |

### Playlist Configuration Options
| Option           | Required | Description                                                                                                                    |
|------------------|----------|--------------------------------------------------------------------------------------------------------------------------------|
| `playlistId`     | Yes      | ID of the YouTube playlist                                                                                                     |
| `shuffle`        | No       | Whether to shuffle the playlist (default is false)                                                                             |
| `autoSwitchTime` | No       | Time of day to automatically switch to this playlist (format: "HH:MM"). Only applies when the player is not currently playing. |

## Notifications

This module responds to the following notifications:

| Notification                        | Description                                                             |
|-------------------------------------|-------------------------------------------------------------------------|
| `MMM_REMOTEYOUTUBE_PLAY`            | Play or pause the video                                                 |
| `MMM_REMOTEYOUTUBE_PAUSE`           | Pause the video                                                         |
| `MMM_REMOTEYOUTUBE_STOP`            | Stop the video, reset volume to default and hide the module immediately |
| `MMM_REMOTEYOUTUBE_NEXT`            | Skip to the next video                                                  |
| `MMM_REMOTEYOUTUBE_PREVIOUS`        | Go back to the previous video                                           |
<<<<<<< Updated upstream
| `MMM_REMOTEYOUTUBE_SWITCH_PLAYLIST` | Switch to the next playlist                                             |
=======
| `MMM_REMOTEYOUTUBE_SWITCH_PLAYLIST` | Change to a different playlist based on the provided action (payload: number (index of playlist from config) or string with value of "PREV" or "NEXT" |
>>>>>>> Stashed changes
| `MMM_REMOTEYOUTUBE_INCREASE_VOLUME` | Increase the volume (payload: number or object with 'value' property)   |
| `MMM_REMOTEYOUTUBE_DECREASE_VOLUME` | Decrease the volume (payload: number or object with 'value' property)   |

## FAQ
### What 'volumeFactor' is for

I created this module with a Hue Tap Dial as the controller in mind. The value range that can be emitted from the API is much higher (~15-600) than the accepted value range of the YouTube iFrame API (0-100). For example, by using a factor of 5, we can decrease the value per step from 15 to 3.

### Why does it show "This video is unavailable"?

The YouTube API can't access playlists that are private. Make sure that the desired playlist is either public or unlisted.

### Why is the video quality or performance poor?

Performance issues with YouTube on Chromium, especially on embedded systems, are a known problem. Since 2024, the YouTube iFrame API no longer allows manual adjustments to video quality, limiting our ability to improve this aspect. Additionally, issues such as lags and framerate drops may also stem from hardware limitations and connectivity problems. For example, switching to a 5GHz WiFi network on my Raspberry Pi 4B has shown to significantly improve performance, with videos running smoothly on 320px width for extended periods.

## Contributing

If you find any bugs or have suggestions for improvements, please open an issue on the [GitHub repository](https://github.com/DreamyChloe/MMM-HueControl).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.

[mm]: https://github.com/MagicMirrorOrg/MagicMirror
