let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let multer = require('multer');
let type = require('../cloud/modules/type');
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
                project.set("setting", {
                    "title": "#a46580",
                    "text": "#a46580",
                    "button": "#a46580",
                    "cardTopColor": "#df5A34",
                    "cardBottomColor": "#814ea4"
                });
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
                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect("/");
            })

        } else {
            res.redirect("/");
        }
    });

    app.post('/project/edit/:id', upload.array('art'), function (req, res) {

        let token = req.cookies.token;
        let files = req.files;
        let id = req.params.id;
        let projectName = req.body.projectName;
        let projectTitle = req.body.titleColor;
        let projectText = req.body.textColor;
        let projectButton = req.body.btnColor;
        let projectTopColor = req.body.topColor;
        let projectBottomColor = req.body.bottomColor;
        let projectVersion = parseInt(req.body.projectVersion);
        let fileDetails = [];

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Projects).equalTo("objectId", id).first();

            }).then(function (project) {

                project.set("name", projectName);
                project.set("version", projectVersion);
                project.set("setting", {
                    "title": projectTitle,
                    "text": projectText,
                    "button": projectButton,
                    "cardTopColor": projectTopColor,
                    "cardBottomColor": projectBottomColor
                });

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

                console.log("PROJECT " + JSON.stringify(project));

                //Delete tmp fil after upload
                let tempFile = fileDetails[0].path;
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


                return true;

            }).then(function () {

                res.redirect('/project/edit/' + id);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/project/edit/' + id);

            })
        } else {
            res.redirect('/');
        }

    });

    app.get('/project/add/:itemType/:itemId/:projectId', function (req, res) {

        let token = req.cookies.token;
        let itemType = req.params.itemType;
        let itemId = req.params.itemId;
        let projectId = req.params.proejctId;
        let pack = "pack";
        let story = "story";
        let projectArray = [];

        if (token) {

            let _user = {};
            projectArray.push(projectId);
            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Packs).equalTo("userId", _user.id).containedIn("projectIds", projectArray).find()

            }).then(function (items) {

                res.render("pages/projects/add_project", {
                    itemType: itemType,
                    itemId: itemId,
                    items: items,
                    projectId: projectId,
                    type: type
                })
            }, function (error) {
                console.log("ERROR " + error.message);
                if (itemType === pack){

                    res.redirect('/pack/' + itemId + '/' + projectId);

                }else if (itemType === story){
                    res.redirect('/stroyedit/' + itemId + '/' + projectId);
                }
            })
        }else {
            res.redirect('/');
        }
    });
};
