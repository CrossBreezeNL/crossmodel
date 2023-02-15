# CrossModel Community Edition

## Getting started

Please install all necessary [prerequisites](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#prerequisites) on your system.

## Installing the application dependencies

    yarn

## Running the application

    yarn start:electron

_or:_

    yarn rebuild:electron
    cd applications/electron-app
    yarn start

_or:_ launch `Launch CrossModel Electron` configuration from VS code.

## Developing

Start watching all packages, including `electron-app`, of your application with

    yarn watch

_or_ watch only specific packages with

    cd packages/<package-name>
    yarn watch

and the Electron example.

    cd applications/electron-app
    yarn watch

Run the example as [described above](#running-the-application).

Any code changes will be automatically detected and the application will be re-compiled.
If you only made changes to the frontend or plugins, simply reloading the running application with `F5` is enough.
If you also made changes to the backend, you can close and restart the appliaction without manual re-compilation.

## Packaging

To package the application use

    yarn electron package

Depending on the platform, this will produce an executable or an installer for the application under `applications/electron-app/dist`.
Details about the packaging can be configured in `applications/electron-app/electron-builder.yml`.
