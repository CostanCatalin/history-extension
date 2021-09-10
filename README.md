# history-extension
A chrome extension that highlights the differences between the current and the previous visit of a webpage.

It comes along with an options page where you can edit the styling of the highlight and see data about the changes history.
It's been built with the help of Firebase, which has been used for authentication (through Google) and data persistance.


### Prerequisites

* Nodejs along with NPM
* Gulp
```
npm install -g gulp
```

### Installing
Gulp has been used to compile and minify scss. 

Inside **option-page** folder you'll have to run
```
npm i
```
to install all the modules used and

```
gulp
```
will compile the files and start watching for scss and js changes


## Built With

* [Firebase](https://firebase.google.com/) -  Web application development platform
* [Bootstrap](https://getbootstrap.com/docs/3.3/) -  Front-end framework
* [jQuery](https://jquery.com/) - JavaScript library
* [Gulp](https://gulpjs.com/) -  Toolkit for automation
* [Sass](http://sass-lang.com/) - CSS extension


## Authors
* **Catalin Costan**
* **Raluca Plugariu**

## License
This project is licensed under the MIT License - see the LICENSE file for details
