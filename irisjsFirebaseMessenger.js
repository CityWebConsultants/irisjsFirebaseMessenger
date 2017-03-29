var request = require("request");
/*
  Hook to show the page for modifying the mysql info
 */

iris.modules.irisjsFirebaseMessenger.globals.renderMessageForm = function (thisHook, data) {

  data.schema.serverKey = {
    "type": "text",
    "title": "Server Key",
    "required": true,
    "default":  ""
  };
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

iris.modules.irisjsFirebaseMessenger.registerHook("hook_form_render__message", 0, function (thisHook, data) {

  iris.modules.irisjsFirebaseMessenger.globals.renderMessageForm(thisHook, data);

});

iris.modules.irisjsFirebaseMessenger.registerHook("hook_form_submit__message", 0, function (thisHook, data) {

  iris.modules.irisjsFirebaseMessenger.globals.sendNotification(thisHook, thisHook.context.params);

});

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