# About
<img width="1920" alt="Screenshot 2023-05-11 at 17 33 42" src="https://github.com/daily-co/daily-precall-react/assets/12814720/672d068b-f32d-46d2-82d5-354353ca0857">


This repository demonstrates how to create a precall experience using the [Daily Client SDK for Javascript](https://docs.daily.co/guides/products/client-sdk) and [Daily React](https://docs.daily.co/reference/daily-react).
A good precall experience where users can check their devices and test their network conditions is a great way to proactively tackle any potential in-call issues.

This repo contains two folders: `daily-precall-react`, a helper library, and `daily-precall-starterkit`, a precall experience application.

# How to install
We recommend you [fork this repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo), so you can use it as a starting point for your own precall experience.

This repo uses Yarn, Yarn workspaces, and [Turborepo](https://turbo.build/). The quickest way to get started is to install Turbo globally on your local machine.

```bash
# clone repo (replace url with the location of your fork)
git clone git@github.com:daily-co/daily-precall-react.git

# install Turbo globally (Yarn)
yarn global add turbo
# or for npm users
npm install turbo --global 

# go to root folder
cd daily-precall-react

# install dependencies
yarn install

# run both the app and library
turbo dev 

# build both the app and the library
turbo build
```

# How to use
Once you've followed the installation steps, you can run `turbo dev` to get the repo up and running. This command will start watching changes in both the app (which you'll find in `apps/daily-precall-starterkit`) and the library, which is found in `packages/daily-precall-react`. Any changes you make in either of these packages will be picked up by the other. 

The starterkit can be found on `http://127.0.0.1:5173/` -- note that the port might change depending on any other processes you have running. You'll always find the URL in your terminal:

<img width="550" alt="Screenshot 2023-05-23 at 12 59 44" src="https://github.com/daily-co/daily-precall-react/assets/12814720/49c8dab5-fff4-4925-b9ce-7b552706622c">

For both packages, we use [Vite](https://vitejs.dev/) for development and building.

# Testing
We've set up automatic tests for the library using Jest and React Testing Library. You can run the tests from the root folder using the following command:

```bash
# run all tests
turbo test

# watching tests
turbo test:watch
```
