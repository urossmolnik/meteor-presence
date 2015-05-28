Presences = new Mongo.Collection('presences');
// For backwards compatibilty
Meteor.presences = Presences;

Meteor.methods({
  updatePresence: function(state) {
    check(state, Match.Any);

    var connectionId = this.isSimulation
      ? Meteor.connection._lastSessionId
      : this.connection.id;

    // Should never happen
    if (! connectionId)
      return;
      
    var userId = (typeof Meteor.userId !== 'undefined' && Meteor.userId()) ? Meteor.userId() : null;

    Presences.update(connectionId, {$set: {state: state, userId: userId}});
  }
});
