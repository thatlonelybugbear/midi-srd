import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function levitate(args) { //done -maybe stylze the dialog better
    if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const initialMutName = "levitationActivation"
    if (args[0] !== "off" && args[0] !== "on") {
        const { macroPass, actor, tokenUuid, item, targets, workflow: {token}, saves } = args[0] ?? {};
        if(!args[0]) return ui.notifications.error("MidiSRD-Levitate: Something is wrong in the macro of the Item rolled; Notify GM and un-check Item Macros Sheet Hooks option");
        if (!targets.length) return ui.notifications.error("Please select a target");

        const tokenDoc = fromUuidSync(tokenUuid);
        const targetDoc = targets[0];
        const initialTargetUuid = DAE.getFlag(tokenUuid,'levitateMidiSRDTarget');

        if (macroPass === "preItemRoll") {
            if (!initialTargetUuid || initialTargetUuid === targetDoc.uuid) return true;
            else {  //if (initialTargetUuid !== targetDoc.uuid)
                await warpgate.revert(tokenDoc,initialMutName)
                await actor.effects.find(eff=>eff.label.toLocaleLowerCase().includes("concentrating"))?.delete()
            }
        }
        if (macroPass === "postActiveEffects") {
                if (!!saves.length) return console.log("target saved against levitate spell")
            if (!initialTargetUuid || initialTargetUuid !== targetDoc.uuid) await DAE.setFlag(actor,'levitateMidiSRDTarget',targetDoc.uuid);
            const content = `<label for="elev"><b><center>Would that be up or down?</center></b></label><br />
                                <input type="range" step="1" min="-20" max="20" id="elev" name="feet" list="values" />
                            <center><b>Selected value: <output id="value"> ft</output></center></b>
                            <datalist id="values">
                                <option value="-20" label="-20"></option>
                                <option value="-10" label="-10"></option>
                                <option value="0" label="0"></option>
                                <option value="10" label="10"></option>
                                <option value="20" label="20"></option>
                            </datalist>`
            const result = await Dialog.wait({ 
                title: "Let's Float!", 
                content: content, 
                default:"no",
                close: () => {return false},
                render:() => {
                    const value = document.querySelector("#value")
                    const input = document.querySelector("#elev")
                    value.textContent = input.value
                    input.addEventListener("input", (event) => {
                        value.textContent = event.target.value
                    })
                },
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Float",
                        callback: () => {
                            const ft = document.querySelector("#elev").value
                            return ft;
                        }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Stop concentrating",
                        callback: async () => {
                            await actor.effects.find(eff=>eff.label.toLocaleLowerCase().includes("concentrating"))?.delete();
                            return false;
                        }
                    }
                },
                rejectClose: false
            });
            if (result) {
                const targetUpdates = targetDoc.actor.effects.find(eff=>eff.label === "Levitating") 
                ? { token: {elevation: Number(targetDoc.elevation) + Number(result)}}
                : {
                    embedded: {
                        ActiveEffect:{
                            ["Levitating"]: {
                                duration: {startTime:game.time.worldTime, seconds:600, startRound:game.combat?.round,startTurn:game.combat?.turn},
                                icon: "icons/magic/control/debuff-energy-hold-levitate-pink.webp",
                                label: "Levitating",
                                origin: item.uuid
                            }
                        }
                    },
                    token: {elevation: Number(targetDoc.elevation) + Number(result)}
                }
                await warpgate.mutate(targetDoc,targetUpdates,{},{permanent:true});
                await ChatMessage.create({ content: `${targetDoc.name} floats at ${targetDoc.elevation} ft` });
            }
            if (!result || MidiSRDHelpers._hasMutation(tokenDoc,initialMutName)) return console.log("aborted");
            const effectUuid = targetDoc.actor.effects.find(eff=>eff.label==="Levitating").uuid;
            const activation = targetDoc.uuid === tokenUuid ? {type:'special',cost:''} : item.system.activation;
            let casterUpdates = {
                embedded: {
                    Item: {
                        [item.name]: {
                            name: item.name + ' activated',
                            system: {
                                actionType: 'other',
                                activation,
                                components:{concentration:false},
                                level: 0,
                                preparation: {mode: 'atwill', prepared: true},
                                save: {ability: '', dc: '', scaling: ''},
                                uses: {value: null, max: '', per: '', recovery: ''}
                            },
                        }
                    },
                },
                actor: {
                    flags: {
                        ["midi-qol"]: { ["concentration-data"]: { removeUuids:[effectUuid] } },
                        dae: { levitateMidiSRDTarget: targetDoc.uuid }
                    }
                }
            }
            await warpgate.mutate(tokenDoc,casterUpdates,{},{name:initialMutName});
            casterUpdates = {embedded: {ActiveEffect:{["Concentrating"]:{changes:[{key:"macro.itemMacro",mode:0,value:"ItemMacro.Levitate activated"}]}}}}; //update due to comparisonkey present
            await warpgate.mutate(tokenDoc,casterUpdates,{},{permanent:true});
        }
    }        
    if (args[0] === "off") {  //the off is when the concentration effect is deleted on the caster.
        const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
        if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
        const targetDoc = fromUuidSync(DAE.getFlag(token.document.uuid,'levitateMidiSRDTarget'));
        await warpgate.mutate(targetDoc,{token:{elevation: 0}},{},{permanent:true});
        await ChatMessage.create({ content: `${targetDoc.name} gently floats to the ground` });
        await warpgate.revert(token.document,initialMutName);
        if (targetDoc.actor.effects.find(eff=>eff.label === "Levitating")) await MidiQOL.socket().executeAsGM("removeEffects",{actorUuid:targetDoc.uuid, effects:[targetDoc.actor.effects.find(eff=>eff.label === "Levitating").id]});
        await DAE.unsetFlag(actor,"levitateMidiSRDTarget");
    }
}