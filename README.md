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

    yarn theia:electron package

Depending on the platform, this will produce an executable or an installer for the application under `applications/electron-app/dist`.
Details about the packaging can be configured in `applications/electron-app/electron-builder.yml`.

## Example Workspace

Under `examples/workspace` we provide an example workspace with some demo packages containing entities, relationships and system diagrams.
Each package represents a dedicated system or library and may depend on other packages.

Using a known package structure - npm in our case - we can re-use large parts of the package management to download dependencies that are not locally available from an external package registry.
In order to test this behavior, we use verdaccio as a local npm registry that provides some models that are needed by our workspace packages.
You can start verdaccio using

    yarn start:verdaccio

The local npm registry will be available under `http://localhost:4873/` where we already provide four packages by default.

After opening the workspace, you can install the necessary dependencies in the example workspace by opening a terminal in `examples/workspace` and execute

    npm install

This should download all dependencies into dedicated `node_modules` directories within the workspace.

Currently there is still an issue where new files are not recognized automatically, so you need to reload your workspace once for all the dependencies to be properly recognized.
