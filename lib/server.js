var connections = {};
var servers = new Mongo.Collection('presenceServers');

// Override in application so meteor-presence can handle multiple servers
Presences.serverId = '';

var expire = function(id) {
  Presences.remove(id);
  delete connections[id];
};

var tick = function(id) {
  connections[id].lastSeen = Date.now();
};

var serverTick = function() {
  if (!Presences.serverId) return;
  servers.upsert({_id: Presences.serverId}, {$set: {tick: Date.now()}});
}

Meteor.startup(function() {
  if (!Presences.serverId) {
    Presences.remove({serverId: {$exists: false}});
  } else {
    Presences.remove({serverId: Presences.serverId});
    serverTick();
  }
});

Meteor.onConnection(function(connection) {
  // console.log('connectionId: ' + connection.id);
  var presence = { _id: connection.id };
  if (Presences.serverId) {
    presence.serverId = Presences.serverId;
  }
  Presences.insert(presence);

  connections[connection.id] = {};
  tick(connection.id);

  connection.onClose(function() {
    // console.log('connection closed: ' + connection.id);
    expire(connection.id);
  });
});

Meteor.methods({
  presenceTick: function() {
    check(arguments, [Match.Any]);
    if (this.connection && connections[this.connection.id]) {
      tick(this.connection.id);
      return true;
    } else {
      return false;
    }
  }
});

Meteor.setInterval(function() {
  _.each(connections, function(connection, id) {
    if (connection.lastSeen < (Date.now() - 10000)) {
      expire(id);
    }
  });
}, 5000);

Meteor.setInterval(function() {
  serverTick();
}, 60000);

Meteor.setInterval(function() {
  servers.remove({tick: {$lt: Date.now() - 60000}});
  var serverIds = servers.find({}, {fields: {_id: 1}}).map(function(s) {return s._id});
  Presences.remove({serverId: {$nin: serverIds}});
}, 180000);