# ❓ What is this
This is the third version of the [Homelab](https://github.com/minion6011/Home-Lab) <br>
> What does it include?
- **Login System** <br>
  **Every user** who tries to access **any page** of the site must enter a username and password.<br>
  After entering the credentials, *if they are correct*, the user's IP address is recorded and a login session is created for a pre-established *duration* (`can be modified from the configs`).<br>
  Once the duration has expired, the user will have to log in again.
- **Home** <br>
  It allows you to run commands on the site host, view component usage statistics and allows you to view your login session information.
- **Music** <br>
  It allows you to **create playlists** and **add songs** from **YouTube** *(through name, link and playlist)* or import a playlist from Spotify (*requires an [app](https://developer.spotify.com/dashboard) `client ID` and `secret`, you don't need to have* **Spotify Premium**). <br>
  This page has a <b>discord RPC integration</b> that you can install from the [RPC folder](/RPC/README.md); You can enable/disable this integration by changing `RPCEnabled` value.
- **Accounting** <br>
  It allows you to keep an accounting within the site with the possibility of adding payments of **two types** (*profit and loss*), together with their addition date (**date on which the payment was added to the site**) and description.
- **Agenda** <br>
  Allows you to have a **to-do list** and **notes** within the site.
- **Compression** <br>
  It allows you to compress **video** and **audio** using various codecs. <br>
  To use this on **Windows** you need to install **[ffmpeg.exe](https://www.gyan.dev/ffmpeg/builds/)** and add it inside the folder where the homelab is located. <br>
  Some codecs are not supported by default on **linux** so you need to install them, this operation varies depending on the distro you're using. **For Fedora** i suggest to [follow this tutorial](https://www.reddit.com/r/linuxadmin/comments/1mktzer/fedora_42_how_to_install_video_codecs_using_rpm/).
- **Configs**
  It allows you to change the **colors of the two themes** (`themes.css`) of the site (*light and dark*), the configuration file (`config.json`) and to disconnect and/or see the **users connected to the site**.


# 💻 How to install
<details>
<summary><b>Install the Homelab ⚙️</b></summary>

  To install the **HomeLab** you need to follow these steps:

  1. Clone the Repository
  2. Install Python (Tested with `Python 3.11`)
  3. Install all the requirements
  4. Setup the `config.json`
   
  - Install [Node.js](https://nodejs.org/en/download) *(necessary for the Music section)*
  - Install [ffmpeg.exe](https://www.gyan.dev/ffmpeg/builds/) *(necessary for the Compression section on Windows)*
</details>

<details>
<summary><b>Use Discord RPC 🔊</b></summary>

  To use **Discord RPC** for the **Homelab** *Music section* you need to follow these steps:

  1. Install Python (Tested with `Python 3.11`)
  2. Install all the requirements
  3. Open [Discord Developer Portal](https://discord.com/developers/applications) and create an App for the Homelab
  4. Add the App Id inside main.py

  > The files needed to use **Discord RPC** are located in the `/RPC` folder.
  
</details>

<br>

## • Credits
### Images & Icons
- **Login background image**: Image by **[Freepik](https://microsoft.github.io/monaco-editor/)**
- **System icon**: Image by **[Freepik](https://microsoft.github.io/monaco-editor/)**
- **Logout icon**: Icon by **Afian Rochmah Afif** – [Flaticon](https://www.flaticon.com/)
- **Start icon**: Icon by **Gregor Cresnar** - [Flaticon](https://www.flaticon.com/)
- **Time icon**: Icon by **Freepik** – [Flaticon](https://www.flaticon.com/)
- **Add icon**: Icon by **Yudhi Restu** – [Flaticon](https://www.flaticon.com/)
- **Details icon**: Icon by **Fir3Ghost** – [Flaticon](https://www.flaticon.com/)
- **Image icon**: From *plDefault.webm* by **Superndre** – [Flaticon](https://www.flaticon.com/)
- **Shuffle icon**: Icon by **Pixel perfect** – [Flaticon](https://www.flaticon.com/)
- **Pencil icon**: Icon by **Anggara** – [Flaticon](https://www.flaticon.com/)
- **Delete icon**: Icon by **Ilham Fitrotul Hayat** – [Flaticon](https://www.flaticon.com/)
- **Add songs icon**: Icon by **bsd** – [Flaticon](https://www.flaticon.com/)
- **Next song icon**: Icon by **Abdul Allib** – [Flaticon](https://www.flaticon.com/)
- **Mute volume icon**: Icon by **meaicon** – [Flaticon](https://www.flaticon.com/)
- **Volume icon**: Icon by **apien** – [Flaticon](https://www.flaticon.com/)

### Libraries & Tools
- **[Monaco Editor](https://microsoft.github.io/monaco-editor/)** - License: MIT
- **[pytubefix](https://github.com/JuanBindez/pytubefix)** - License: MIT
- **[flask](https://flask.palletsprojects.com/en/stable/)** – License: BSD-3-Clause
- **[psutil](https://github.com/giampaolo/psutil)** - License: BSD-3-Clause
- **[spotipy](https://spotipy.readthedocs.io/)** - License: MIT
- **[ffmpeg](https://www.ffmpeg.org/)** - License: GNU