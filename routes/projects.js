let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let multer = require('multer');
let fs = require('fs');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("Dest " + JSON.stringify(file));
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

let upload = multer({storage: storage});


module.exports = function (app) {

    app.post("/project", function (req, res) {

        let token = req.cookies.token;
        let name = req.body.projectName;

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                let Project = new Parse.Object.extend(_class.Projects);
                let project = new Project();

                project.set("name", name);
                project.set("userId", _user.id);
                project.set("version", 1);

                return project.save();

            }).then(function () {

                res.redirect("/projects");

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect("/projects");
            })
        } else {
            res.redirect("/");
        }
    })

    app.get("/projects", function (req, res) {
        let token = req.cookies.token;

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Projects).equalTo("userId", _user.id).find();

            }).then(function (projects) {
                res.render("pages/projects/projects", {
                    projects: projects
                })
            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect("/");
            })
        } else {
            res.redirect("/");
        }
    });

    app.get("/project/edit/:id", function (req, res) {

        let token = req.cookies.token;
        let projectId = req.params.id;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Projects).equalTo("objectId", projectId).first();

            }).then(function (project) {

                res.render("pages/projects/edit_project", {
                    project: project
                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect("/");
            })

        }else {
            res.redirect("/");
        }
    });

    app.post('/project/edit/:id', upload.array('art'), function (req, res) {

        let token = req.cookies.token;
        let files = req.files;
        let id = req.params.id;
        let projectName = req.body.projectName;
        let projectVersion = parseInt(req.body.projectVersion);
        let fileDetails = [];

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Projects).equalTo("objectId", id).first();

            }).then(function (project) {

                project.set("name", projectName);
                project.set("version", projectVersion);

                if (files !== undefined || files !== "undefined") {
                    files.forEach(function (file) {
                        let fullName = file.originalname;
                        let stickerName = fullName.substring(0, fullName.length - 4);

                        let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                        let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);

                        project.set("uri", parseFile);
                        fileDetails.push(file);

                    });
                }

                return project.save();

            }).then(function (project) {

                _.each(fileDetails, function (file) {
                    //Delete tmp fil after upload
                    let tempFile = file.path;
                    fs.unlink(tempFile, function (error) {
                        if (error) {
                            //TODO handle error code
                            //TODO add job to do deletion of tempFiles
                            console.log("-------Could not del temp" + JSON.stringify(error));
                        }
                        else {
                            console.log("-------Deleted All Files");

                        }
                    });
                });


                res.redirect('/project/edit/' + id);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/project/edit/' + id);

            })
        } else {
            res.redirect('/');
        }

    });


};
