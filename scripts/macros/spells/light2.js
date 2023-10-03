import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function light(args, options) {
	if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const mutName = "lightSpell"
    if (args[0].macroPass === "postActiveEffects") {
		let {dim,bright,color,alpha,type,speed,intensity,angle} = options ?? {}
		const previousTargetUuid = DAE.getFlag(actor, "lightSRD");
		const previousTokenDoc = previousTargetUuid ? fromUuidSync(previousTargetUuid) : undefined;
		const effect = previousTokenDoc ? previousTokenDoc.actor.effects.find(eff=>eff.label==="Light") : undefined;

		if (!!args[0].saves.length && effect) return await MidiQOL.socket().executeAsGM("removeEffects", {actorUuid: previousTokenDoc.uuid, effects:[effect.id]})
		if (previousTargetUuid && effect) await MidiQOL.socket().executeAsGM("removeEffects", {actorUuid: previousTokenDoc.uuid, effects:[effect.id]})

		let content = "";
		let optionUpdates;
		if (!color) content += `
			<div style="display: flex; align-content: center;">
		    <label for="color" style="line-height: 25px;">Color:</label>
		    <input type="color" value="${game.user.color}" id="color" style="margin: 0 10px 10px; width: 100%;">
		    </div>`
		if (!alpha) content += `
			<div class="form-group">
			<label for="alpha" style="line-height: 26px;">Color Intensity (Alpha):</label>
			<div class="form-fields">
			<input type="range" value="0.25" id="alpha" min="0" max="1" step="0.05">
			<span class="range-value">0.25</span>
			<p class="hint">Apply coloration to this light source and configure its intensity.</p>
			<center><b><output id="alphaOutput"></output></b></center>
		    </div></div>`
		if (!dim) content += `
			<div style="display: flex; align-content: center;">
			<label for="dim" style="line-height: 25px;">Dim:</label>
			<input type="range" value="40" id="dim" min="0" max="120" step="5" style="margin: 0 10px 10px; width: 90%;">
			<center><b><output id="dimOutput"></output></b></center>
		    </div>`
		if (!bright) content += `
			<div style="display: flex; align-content: center;">
			<label for="bright" style="line-height: 25px;">Bright:</label>
			<input type="range" value="20" id="bright" min="0" max="120" step="5" style="margin: 0 10px 10px; width: 90%;">
			<center><b><output id="brightOutput"></output></b></center>
		    </div>`
		if (!angle) content += `
			<div style="display: flex; align-content: center;">
			<label for="angle" style="line-height: 25px;">Angle:</label>
			<input type="range" value="360" id="angle" min="0" max="360" step="1" style="margin: 0 10px 10px; width: 90%;">
			<center><b><output id="angleOutput"></output></b></center>
		    </div>`

		    
		if (content) {
			optionUpdates = await Dialog.wait({
			    title: `Select Light colour: (it's Lukas▿#8507 fault)`,
			    content: `
				    <form>
				    ${content}
				    </form>
			    `,
			    buttons: getLights(),
				default: "close",
			    close: () => {return false},
				render: () => {
					const valueAlpha = document.querySelector("#alphaOutput")
                    const inputAlpha = document.querySelector("#alpha")
					if (valueAlpha && inputAlpha) {
						valueAlpha.textContent = inputAlpha.value
						inputAlpha.addEventListener("input", (event) => {
	                        valueAlpha.textContent = event.target.value
	                    })
					}
					const valueDim = document.querySelector("#dimOutput")
                    const inputDim = document.querySelector("#dim")
					if (valueDim && inputDim) {
						valueDim.textContent = inputDim.value
						inputDim.addEventListener("input", (event) => {
	                        valueDim.textContent = event.target.value
	                    })
					}
					const valueBright = document.querySelector("#brightOutput")
                    const inputBright = document.querySelector("#bright")
					if (valueBright && inputBright) {
						valueBright.textContent = inputBright.value
						inputBright.addEventListener("input", (event) => {
	                        valueBright.textContent = event.target.value
	                    })
					}
					const valueAngle = document.querySelector("#angleOutput")
                    const inputAngle = document.querySelector("#angle")
					if (valueAngle && inputAngle) {
						valueAngle.textContent = inputAngle.value
						inputAngle.addEventListener("input", (event) => {
	                        valueAngle.textContent = event.target.value
	                    })
					}
				}
			})

			function getLights() {
			    let lightButtons = {};
			    lightButtons = Object.assign(lightButtons, {
			        apply: {
			            label: `Apply`,
			            icon: "<i class='fa-solid fa-lightbulb'></i>",
			            callback: (html) => {
			                const newColor = document.querySelector("#color")?.value ?? color;
							const newAlpha = document.querySelector("#alpha")?.value ?? alpha;
							const newDim = document.querySelector("#dim")?.value ?? dim;
							const newBright = document.querySelector("#bright")?.value ?? bright;
							const newAngle = document.querySelector("#angle")?.value ?? angle;
							/*const newColor = html.find("#color")?.val() ?? color;
							const newAlpha = html.find("#alpha")?.val() ?? alpha;
							const newDim = html.find("#dim")?.val() ?? dim;
							const newBright = html.find("#bright")?.val() ?? bright;
							const newAngle = html.find("#angle")?.val() ?? angle;*/
			                return {color:newColor, alpha:newAlpha, dim:newDim, bright:newBright, angle:newAngle};
			            }
			        }
		        })
		        return lightButtons;
		    }
		}
		if (!optionUpdates) return;
		//if(!color) color = optionUpdates.color;
		//if(!alpha) alpha = optionUpdates.alpha;
		//if(!dim) dim = optionUpdates.dim;
		//if(!bright) bright = optionUpdates.bright;
		console.log(optionUpdates)
		optionUpdates.animation={type,speed,intensity}
    	//const updates = { token: { light: { dim, bright, color, alpha, angle, animation: { type,speed,intensity } } } };
		const updates = { token: { light: optionUpdates } };
		const target = args[0].hitTargets[0]; //Token5e#Document
    	if (MidiSRDHelpers._hasMutation(target,mutName)) 
			await MidiQOL.socket().executeAsGM("removeEffects", {actorUuid: target.uuid, effects:[target.actor.effects.find(eff=>eff.label==="Light")?.id]})
		await warpgate.mutate(target,updates,{},{name:mutName});
		await DAE.setFlag(actor, "lightSRD", target.uuid);
		console.log("ADD:", target.uuid)
    }
    if (args[0] === "off") {
		console.log(token.document.uuid)
		if (MidiSRDHelpers._hasMutation(token,mutName)) {
			await warpgate.revert(token.document,mutName);
			await DAE.unsetFlag(fromUuidSync(lArgs.origin).actor, "lightSRD"); 
		}
	}
}


<div class="form-group">
                <label>Light Animation Type</label>
                <div class="form-fields">
                    <select name="light.animation.type">
                        <option value="">None</option><option value="flame">Torch</option><option value="torch">Flickering Light</option><option value="pulse" selected="">Pulse</option><option value="chroma">Chroma</option><option value="wave">Pulsing Wave</option><option value="fog">Swirling Fog</option><option value="sunburst">Sunburst</option><option value="dome">Light Dome</option><option value="emanation">Mysterious Emanation</option><option value="hexa">Hexa Dome</option><option value="ghost">Ghostly Light</option><option value="energy">Energy Field</option><option value="roiling">Roiling Mass</option><option value="hole">Black Hole</option><option value="vortex">Vortex</option><option value="witchwave">Bewitching Wave</option><option value="rainbowswirl">Swirling Rainbow</option><option value="radialrainbow">Radial Rainbow</option><option value="fairy">Fairy Light</option><option value="grid">Force Grid</option><option value="starlight">Star Light</option><option value="smokepatch">Smoke Patch</option>
                    </select>
                </div>
            </div>