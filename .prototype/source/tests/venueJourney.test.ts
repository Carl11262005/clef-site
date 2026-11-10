import test from 'node:test';
import assert from 'node:assert/strict';
import {useVenueJourney,resetVenueJourney,venueQuickReplies,venueArtistReply} from '../guidance/musicianFlow.ts';
test('two distinct venue suggestions lead to terms, not completion',()=>{
 resetVenueJourney();
 assert.equal(venueQuickReplies(0).length,1);
 assert.match(venueArtistReply(0),/pay details/);
 useVenueJourney.setState({messages:1});
 assert.match(venueQuickReplies(1)[0],/\$300/);
 useVenueJourney.setState({messages:2});
 assert.deepEqual(venueQuickReplies(2),[]);
 assert.equal(useVenueJourney.getState().termsSent,false);
 useVenueJourney.setState({termsSent:true});
 resetVenueJourney();
 assert.deepEqual(useVenueJourney.getState(),{messages:0,termsSent:false,wizardStep:0});
});
