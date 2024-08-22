# CrossModel on Windows

## Pre-requisites for Windows

To install the pre-requisites on Windows, follow the steps below.

### Install Visual Studio 2022

In order to build CrossModel for Windows you need to have Visual Studio installed with the workload "Desktop development with C++".

#### If you already have a Visual Studio 2022 installed

-   Start the "Visual Studio Installer"
-   Choose "Modify" on the Visual Studio 2022 installation
-   Enable the workload "Desktop development with C++" and click "Modify" so your existing Visual Studio installation is extended with the dependencies for CrossModel.

#### If you don't have Visual Studio 2022 installed

-   Download and install the installer from on the following page:

    -   <https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022>

-   Make sure to enable "Desktop development with C++" during the installation.

### Setup Scoop

Open a PowerShell command window and execute the following commands:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser # Optional: Needed to run a remote script the first time
irm get.scoop.sh | iex
```

### Install Python, Yarn & Node.js

Open a new PowerShell window (this is needed after installing scoop) and execute the following commands:

```powershell
scoop install python@3.11.4
scoop install yarn@1.22.22
scoop install nvm
nvm install 20
nvm use 20
npm config edit
```

In the editor which opens, add a line at the end with the following contents:

```
msvs_version=2022
```

Save the file and close it.

## Troubleshooting

### Node-Gyp issue

When you get errors when building (using Yarn) and the error is about node-gyp (for example: common.gypi not found), try removing the C:\Users\{username}\AppData\Local\node-gyp folder.
