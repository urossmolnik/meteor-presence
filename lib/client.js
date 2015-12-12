Presence = {};
Presence.tickInterval = 5000;
Presence.state = function() {
  return 'online';
};

// For backwards compatibilty
Meteor.Presence = Presence;

Meteor.startup(function() {
  Tracker.autorun(function() {
    // This also runs on sign-in/sign-out
    Meteor.user(); // To be reactive on user
    if (Meteor.status().status === 'connected')
      Meteor.call('updatePresence', Presence.state());
  });

  Meteor.setInterval(function() {
    Meteor.call('presenceTick', function(err, res) {
      if (!err && !res) {
        Meteor.call('updatePresence', Presence.state())
      }
    });
  }, Presence.tickInterval);
});
