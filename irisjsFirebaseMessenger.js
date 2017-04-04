var request = require("request");
var NodeGeocoder = require('node-geocoder');

/**
 * Global function Send notification
 */
iris.modules.irisjsFirebaseMessenger.globals.sendNotification = function (thisHook,params) {

  request({
      url: 'https://fcm.googleapis.com/fcm/send',            
	  method: 'post',        
	  headers: {
          'Content-Type': 'application/json',
          'Authorization': 'key=' + params.serverKey
      },
      json : {
          'data' : { message : params.message },
          'to' : params.recipientToken
      }
  },function(error,response,body){
        if(error){
            thisHook.fail(error);
        }
        else{
            var content = response ? response.body : body;
            thisHook.pass(content);
        }

  });

};

/**
 * Message Form
 */
iris.modules.irisjsFirebaseMessenger.globals.renderMessageForm = function (thisHook, data) {

  data.schema.recipientToken = {
    "type": "text",
    "title": "Recipient Token",
    required: true,
    "default": ""
  };
  data.schema.message = {
    "type": "text",
    "title": "Message",
    "required": true,
    "default": ""
  };

  thisHook.pass(data);
};

/**
 * register hook render message form
 */
iris.modules.irisjsFirebaseMessenger.registerHook("hook_form_render__message", 0, function (thisHook, data) {

  iris.modules.irisjsFirebaseMessenger.globals.renderMessageForm(thisHook, data);

});

/**
 * register hook submit message form
 */
iris.modules.irisjsFirebaseMessenger.registerHook("hook_form_submit__message", 0, function (thisHook, data) {

  iris.readConfig('firebase', 'setting').then(function (config) {
    
    thisHook.context.params.serverKey = config.serverKey;
    iris.modules.irisjsFirebaseMessenger.globals.sendNotification(thisHook, thisHook.context.params);

  }, function (fail) {
    
    iris.modules.irisjsFirebaseMessenger.globals.sendNotification(thisHook, thisHook.context.params);

  });
  

});

/**
 * Message Form
 */
iris.modules.irisjsFirebaseMessenger.globals.renderSettingForm = function (thisHook, data, config) {
  
  data.schema.serverKey = {
    "type": "text",
    "title": "Server Key",
    "required": true,
    "default": config.serverKey ? config.serverKey : ""
  };

  data.schema.apiKey = {
    "type": "text",
    "title": "Api Key",
    "required": true,
    "default": config.apiKey ? config.apiKey : ""
  };

  thisHook.pass(data);
};

/**
 * register hook render setting form
 */
iris.modules.irisjsFirebaseMessenger.registerHook("hook_form_render__setting", 0, function (thisHook, data) {

  iris.readConfig('firebase', 'setting').then(function (config) {
    iris.modules.irisjsFirebaseMessenger.globals.renderSettingForm(thisHook, data, config);

  }, function (fail) {
    iris.modules.irisjsFirebaseMessenger.globals.renderSettingForm(thisHook, data, false);

  });

});

/**
 * register hook submit setting form
 */
iris.modules.irisjsFirebaseMessenger.registerHook("hook_form_submit__setting", 0, function (thisHook, data) {

  iris.saveConfig(thisHook.context.params, 'firebase', 'setting');
  thisHook.pass(data);

});

/**
 * route to message form
 */
iris.route.get("/firebase/message", {}, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["message"], ['admin_wrapper'], {
    'current': req.irisRoute.options,
  }, req.authPass, req).then(function (success) {

    res.send(success);

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

var menus = {
  "firebaseadmin": {
    "title": "Firebase setting",
    "description": "Administer firebase server details.",
    "permissions": ["can administer firebase"],
    "menu": [{
      menuName: "admin_toolbar",
      parent: "/admin/config/firebase",
      title: "Firebase settings"
    }]
  },
};

/*
  Hook to show the page for modifying the mysql info
 */
iris.route.get("/admin/config/firebase", menus.firebaseadmin, function (req, res) {


  iris.modules.frontend.globals.parseTemplateFile(["setting"], ['admin_wrapper'], {
    'current': req.irisRoute.options,
  }, req.authPass, req).then(function (success) {

    res.send(success);

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

iris.modules.irisjsFirebaseMessenger.registerHook("hook_entity_created", 1, function (thisHook, data) {

  if((data.entityType == "alert") && data.longitude && data.latitude){

    iris.readConfig('firebase', 'setting').then(function (config) {
        var options = {
          provider: 'google',
          httpAdapter: 'https',
          apiKey: 'AIzaSyCsTYaocLheFVf7ZH672ZylG6Z66u5WBpA',
          formatter: null 
        };
        var geocoder = NodeGeocoder(options);
        geocoder.reverse({lat:data.latitude, lon:data.longitude})
        .then(function(res) {
          var location = res[0];
          data.city = location.city;
          data.country = location.country;
          data.full_address = location.formattedAddress;
          iris.invokeHook("hook_entity_edit", thisHook.authPass, null, data)
          .then(function (success) {
            console.log("update work...");
            thisHook.pass(data);

          }, function (fail) {
            console.log("Failed to update...");
            console.log(fail);
            thisHook.fail(fail);
          });
        })
        .catch(function(err) {
          iris.log("error", err);
          thisHook.pass(data);
        });


    }, function (fail) {
      thisHook.fail(fail);
    });
  }

  thisHook.pass(data);

});