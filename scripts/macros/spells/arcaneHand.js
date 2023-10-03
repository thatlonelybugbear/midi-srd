import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function arcaneHand(args, texture) { //check
        const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
        if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
        const mutName = "arcaneHandMidiSRDlink"
        if (args[0] === "on") {
            if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
            if (!game.actors.getName("Generic Actor for MidiSRD")) { await MidiSRDHelpers._createActor({ name: "Generic Actor for MidiSRD", type: "npc" }) }
            const { castLevel, baseLevel, itemUuid } = lArgs.efData.flags['midi-qol'].castData;
            const sourceItem = await fromUuid(itemUuid);
            texture = texture || sourceItem.img
            const summonerDc = actor.system.attributes.spelldc;
            const summonerAttack = Number(summonerDc) - 8;
            const summonerMod = sourceItem.abilityMod ?? actor.system.abilities[actor.system.attributes.spellcasting].mod; //?? should not be needed.
           //const summonerMod = getProperty(actor, `system.abilities.${getProperty(actor, 'system.attributes.spellcasting')}.mod`)
            
            let fistScale = '';
            let graspScale = '';
            if (castLevel > baseLevel) {
                fistScale = ` + ${((castLevel - baseLevel) * 2)}d8[upcast]`;
                graspScale = ` + ${((castLevel - baseLevel) * 2)}d6[upcast]`;
            }
            let updates = {
                token: { "name": "Arcane Hand", "img": texture, height: 2, width: 2, "flags": { "midi-srd": { "ArcaneHand": { "ActorId": actor.id } } } },
                actor: {
                    name: "Arcane Hand",
                    'system.attributes.hp': { value: actor.system.attributes.hp.max, max: actor.system.attributes.hp.max },
                    'system.attributes.ac': { flat: 20, calc:"flat", value: 20 },
                    'system.attributes.movement': { fly: 60, hover: true },
                    'system.abilities.str.value': 26,
                    'system.abilities.int.value': Number(summonerAttack)*2,
                    'system.details.type':  {value: 'custom', subtype: '', swarm: '', custom: 'NoTarget'},
                },
                embedded: {
                    Item: {
                        'Clenched Fist': {
                            'system.ability': "int",
                            'system.damage.parts': [[`4d8 ${fistScale}`, 'force']],
                            'system.equipped':true,
                            type: "weapon"
                        },
                        "Grasping Hand": {
                            'system.ability': "int",
                            'system.damage.parts': [[`2d6 ${graspScale} + ${summonerMod}`, 'bludgeoning']],
                            type: "weapon"
                        }
                    }
                }
            }
            let { x, y } = await MidiSRDHelpers._warpgateCrosshairs(token, 120, "Arcane Hand", texture, { height: 2, width: 2 }, 1)

            const spawnedTokenId = await warpgate.spawnAt({ x, y }, "Generic Actor for MidiSRD", updates, { controllingActor: actor });
            const spawnedTokenUuid = canvas.scene.tokens.get(spawnedTokenId).uuid;
            const flagValue = foundry.utils.getProperty(actor, "flags.dae.onUpdateTarget") ?? [];
            const onUpdateData = {
                filter: "system.bonuses.msak.attack",
                sourceTokenUuid: token.document.uuid,
                targetTokenUuid: spawnedTokenUuid,
                sourceActorUuid: actor.uuid,
                origin: itemUuid,
                macroName: `ItemMacro.${itemUuid}`,
                flagName: mutName
            };
            flagValue.push(onUpdateData);
            if (MidiSRDHelpers._hasMutation(token,mutName)) await warpdate.revert(token.document,mutName)
            await warpgate.mutate(token.document,{actor:{flags:{dae:{onUpdateTarget:flagValue}}}},{},{name:mutName});
        }
        else if (args[0] === "off") {
            await MidiSRDHelpers._deleteTokens("ArcaneHand", actor);
            await warpgate.revert(token.document,mutName)
        }
        else if (lArgs.tag === "onUpdateTarget") {
            const arcaneHandTokenDoc = lArgs.targetToken.document;
            const casterToken = lArgs.sourceToken;
            const update = lArgs.updates.system.bonuses.msak.attack;
            const updates = {actor: {'system.bonuses.msak.attack' : update}}
            const result = await warpgate.mutate(arcaneHandTokenDoc, updates, {}, {permanent:true})
        }
    }