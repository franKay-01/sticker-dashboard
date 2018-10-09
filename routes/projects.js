let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');

module.exports = function(app) {

  app.post("/project", function(req, res) {

    let token = req.cookies.token;
    let name = req.body.projectName;

    if (token) {

      let _user = {};

      util.getUser(token).then(function(sessionToken) {

        _user = sessionToken.get("user");

        let Project = new Parse.Object.extend(_class.Projects);
        let project = new Project();

        project.set("name", name);
        project.set("userId", _user.id);

        return project.save();

      }).then(function(){

        res.redirect("/projects");

      }, function(error){

        console.log("ERROR " + error.message);
        res.redirect("/projects");
      })
    } else {
      res.redirect("/");
    }
  })

  app.get("/projects", function(req, res) {
      let token = req.cookies.token;

      if (token) {

        let _user = {};

        util.getUser(token).then(function(sessionToken) {

          _user = sessionToken.get("user");

          return new Parse.Query(_class.Projects).find();

        }).then(function(projects) {
          res.render("pages/projects/projects", {
            projects: projects
          })
        })
      }else {
        res.redirect("/");
      }
  })
}
