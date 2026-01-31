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
  Allows you to have a to-do list and notes within the site.
- **Configs**
  It allows you to change the **colors of the two themes** (`themes.css`) of the site (*light and dark*), the configuration file (`config.json`) and to disconnect and/or see the **users connected to the site**.

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
- **Delete icon**: Icon by **bqlqn** – [Flaticon](https://www.flaticon.com/)
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