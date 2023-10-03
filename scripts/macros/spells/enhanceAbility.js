import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function enhanceAbility(args) { //change the args === on to args.tag===OnUse to create the dialog on the triggering client.
    const { actor, token } = args[0] ?? {};
    if(!actor || !token ) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");

    if (args[0].tag === "OnUse") {
        new Dialog({
            title: "Choose enhance ability effect for " + actor.name,
            buttons: {
                one: {
                    label: "Bear's Endurance",
                    callback: async () => {
                        let formula = `2d6`;
                        let amount = new Roll(formula).roll().total;
                        await DAE.setFlag(actor, 'enhanceAbility', {
                            name: "bear",
                        });
                        const effect = actor.effects.find(i => i.label === "Enhance Ability");
                        const changes = effect.changes;
                        changes[1] = {
                            key: "flags.midi-qol.advantage.ability.save.con",
                            mode: 0,
                            priority: 20,
                            value: `1`,
                        }
                        await effect.update({ changes });
                        await ChatMessage.create({ content: `${actor.name} gains ${amount} temp Hp` });
                        await actor.update({ "system.attributes.hp.temp": amount });
                    }
                },
                two: {
                    label: "Bull's Strength",
                    callback: async () => {
                        await ChatMessage.create({ content: `${actor.name}'s encumberance is doubled` });
                        await DAE.setFlag(actor, 'enhanceAbility', {
                            name: "bull",
                        });
                        const effect = actor.effects.find(i => i.label === "Enhance Ability");
                        const changes = effect.changes;
                        changes[1] = {
                            key: "flags.midi-qol.advantage.ability.check.str",
                            mode: 0,
                            priority: 20,
                            value: `1`,
                        }
                        await effect.update({ changes });
                        await actor.setFlag('dnd5e', 'powerfulBuild', true);
                    }
                },
                three: {
                    label: "Cat's Grace",
                    callback: async () => {
                        await ChatMessage.create({ content: `${actor.name} doesn't take damage from falling 20 feet or less if it isn't incapacitated.` });
                        await DAE.setFlag(actor, 'enhanceAbility', {
                            name: "cat",
                        });
                        const effect = actor.effects.find(i => i.label === "Enhance Ability");
                        const changes = effect.changes;
                        changes[1] = {
                            key: "flags.midi-qol.advantage.ability.check.dex",
                            mode: 0,
                            priority: 20,
                            value: `1`,
                        }
                        await effect.update({ changes });
                    }
                },
                four: {
                    label: "Eagle's Splendor",
                    callback: async () => {
                        await ChatMessage.create({ content: `${actor.name} has advantage on Charisma checks` });
                        await DAE.setFlag(actor, 'enhanceAbility', {
                            name: "eagle",
                        });
                        const effect = actor.effects.find(i => i.label === "Enhance Ability");
                        const changes = effect.changes;
                        changes[1] = {
                            key: "flags.midi-qol.advantage.ability.check.cha",
                            mode: 0,
                            priority: 20,
                            value: `1`,
                        }
                        await effect.update({ changes });
                    }
                },
                five: {
                    label: "Fox's Cunning",
                    callback: async () => {
                        await ChatMessage.create({ content: `${actor.name} has advantage on Intelligence checks` });
                        await DAE.setFlag(actor, 'enhanceAbility', {
                            name: "fox",
                        });
                        const effect = actor.effects.find(i => i.label === "Enhance Ability");
                        const changes = effect.changes;
                        changes[1] = {
                            key: "flags.midi-qol.advantage.ability.check.int",
                            mode: 0,
                            priority: 20,
                            value: `1`,
                        }
                        await effect.update({ changes });
                    }
                },
                six: {
                    label: "Owl's Wisdom",
                    callback: async () => {
                        await ChatMessage.create({ content: `${actor.name} has advantage on Wisdom checks` });
                        await DAE.setFlag(actor, 'enhanceAbility', {
                            name: "owl",
                        });
                        const effect = actor.effects.find(i => i.label === "Enhance Ability");
                        const changes = effect.changes;
                        changes[1] = {
                            key: "flags.midi-qol.advantage.ability.check.wis",
                            mode: 0,
                            priority: 20,
                            value: `1`,
                        }
                        await effect.update({ changes });
                    }
                }
            }
        }).render(true);
    }

    if (args[0] === "off") {
        const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
        if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
        const flag = DAE.getFlag(actor, 'enhanceAbility');
        if (flag.name === "bull") actor.unsetFlag('dnd5e', 'powerfulBuild', false);
        await DAE.unsetFlag(actor, 'enhanceAbility');
        await ChatMessage.create({ content: "Enhance Ability has expired" });
    }
}