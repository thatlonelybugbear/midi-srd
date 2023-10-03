import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs';
export async function regenerate(args) { //rethink if needed
    const { actor, token, lArgs } = MidiSRDhelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    /*
    ** Set hooks to fire on combat update and world time update
    **/
    if (args[0] === "on") {

        // If 6s elapses, update HP by one
        const timeHookId = Hooks.on("updateWorldTime", async (currentTime, updateInterval) => {
            let effect = actor.effects.find(i => i.label === "Regenerate");
            let applyTime = effect.duration.startTime;
            let expireTime = applyTime + effect.duration.seconds;
            let healing = roundCount(currentTime, updateInterval, applyTime, expireTime);
            await actor.applyDamage(-healing);
            await ChatMessage.create({ content: `${actor.name} gains 1 hp` });
        }
        );

        actor.setFlag("world", "Regenerate", {
            timeHook: timeHookId
        }
        );
    }

    if (args[0] === "off") {
        async function RegenerateOff() {
            let flag = await actor.getFlag('world', 'Regenerate');
            Hooks.off("updateWorldTime", flag.timeHook);
            await actor.unsetFlag("world", "Regenerate");
            console.log("Regenerate removed");
        };
        RegenerateOff();
    }


    //**
    // * 
    // * @param {Number} currentTime current world time
    // * @param {Number} updateInterval amount the world time was incremented
    // * @param {Number} applyTime time the effect was applied
    // * @param {Number} expireTime time the effect should expire
    //
    function roundCount(currentTime, updateInterval, applyTime, expireTime) {
        // Don't count time before applyTime
        if (currentTime - updateInterval < applyTime) {
            let offset = applyTime - (currentTime - updateInterval);
            updateInterval -= offset;
        }
        await
        // Don't count time after expireTime
        if (currentTime > expireTime) {
            let offset = currentTime - expireTime;
            currentTime = expireTime;
            updateInterval -= offset;
        }

        let sTime = currentTime - updateInterval;
        let fRound = sTime + 6 - (sTime % 6); // Time of the first round
        let lRound = currentTime - (currentTime % 6); // Time of the last round
        let roundCount = 0;
        if (lRound >= fRound)
            roundCount = (lRound - fRound) / 6 + 1;

        return roundCount;
    }
}