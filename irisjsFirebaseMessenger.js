var request = require("request");

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