const MidiSRDHelpers = await import('./scripts/helpers/midi-srd-helpers.mjs');
const spells = [
  'aid','alterSelf','animateDead','arcaneEye','arcaneHand','arcaneSword','banishment','blindDeafness','callLightning','confusion','contagion','createUndead','darkness','divineWord','enhanceAbility','enlargeReduce','eyebite','findSteed','fireShield','fireStorm','flameBlade','fleshToStone','giantInsect','heroism','invisibility','laughter','levitate','light','magicMissile','magicWeapon','mistyStep','moonbeam','protectionFromEnergy','rayOfEnfeeblement','seeInvisibility','shillelagh','unseenServant','wardingBond'
];
const items = ['bracersArchery','broochOfShielding','glovesMissileSnaring','staffOfStriking'];
const features = ['darkOnesBlessing','discipleOfLife','dragonWings'];
let countS = 0;
let countI = 0;
let countF = 0;
async function midiSRDApiInit() {
  let MidiMacros = {};
  
  for (const spell of spells) {
    const s = await import(`./scripts/macros/spells/${spell}.js`)
    //foundry.utils.mergeObject(MidiMacros,{[spell]:s[spell]});
    MidiMacros[spell]=s[spell];
    countS++;
  }
  for (const item of items) {
    const i = await import(`./scripts/macros/items/${item}.js`)
    //foundry.utils.mergeObject(MidiMacros,{[item]:i[item]}); 
    MidiMacros[item]=i[item];
    countI++;
  }
  for (const feature of features) {
    const f = await import(`./scripts/macros/features/${feature}.js`)
    //foundry.utils.mergeObject(MidiMacros,{[feature]:f[feature]}); 
    MidiMacros[feature]=f[feature];
    countF++;
  }
  MidiMacros.helpers = MidiSRDHelpers;
  window.MidiMacros = MidiMacros;
}

Hooks.once('ready', async () => {
  if (!game.modules.get("warpgate")?.active && game.user?.isGM) {
    console.error(`The Midi SRD module requires to install and activate the 'warpgate' module.`);
    return ui.notifications.error(`The Midi SRD module requires to install and activate the 'warpgate' module.`);
  }
  console.warn("Midi-SRD || Oh yes! Initializing on ready Hooks");
  await midiSRDApiInit()
  console.warn(`Midi-SRD || MidiMacros: spells ${countS} / ${spells.length}, items ${countI} / ${items.length}, features ${countF} / ${features.length}`);
});