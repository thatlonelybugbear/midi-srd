import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function light(args, options) {
	if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const mutName = "MidiSRD: lightSpell"

    if (args[0].macroPass === "preActiveEffects") {
    	const { actor, workflow:{ token }, failedSaves } = args[0];
    	if (!actor || !token || !failedSaves) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
		let {dim,bright,color,alpha,type,speed,intensity,angle} = options ?? {}
		const previousTargetUuid = DAE.getFlag(actor, "lightSRD");
		const previousTokenDoc = previousTargetUuid ? fromUuidSync(previousTargetUuid) : undefined;
		const effect = previousTokenDoc ? previousTokenDoc.actor.effects.find(eff=>eff.label==="Light") : undefined;

		if (previousTargetUuid && effect) await MidiQOL.socket().executeAsGM("removeEffects", {actorUuid: previousTargetUuid, effects:[effect.id]})
		await MidiSRDHelpers._wait(350);
		if (!failedSaves.length) return ui.notifications.info("Light spell resisted");
		let content = "";
		let optionUpdates = "";
		if (!type) {
			const typeOptions = [['none',{label:'None'}]]
				.concat(Object.entries(CONFIG.Canvas.lightAnimations))
				.reduce((acc, [a,b]) => acc += `<option id="type" value="${a}">${game.i18n.localize(b.label)}</option>`, ``);
			content += `
			<div class="form-group">
            	<label>Light Animation Type</label>
            	<div class="form-fields">
            		<select id="type">${typeOptions}</select>
            	</div>
            </div>
            `
        }   
        if (!color) content += `
			<div class="form-group">
				<label for="color" style="line-height: 26px;">Color:</label>
				<div class="form-fields">
					<input type="color" value="${game.user.color}" id="color">
		    	</div>
	    	</div>`
		if (!alpha) content += `
			<div class="form-group">
				<label for="alpha" style="line-height: 26px;">Color Intensity (Alpha):</label>
				<div class="form-fields">
					<input type="range" value="0.25" id="alpha" min="0" max="1" step="0.05">
					<span class="range-value" id="alphaOutput">0.25</span>
				</div>
				<p class="hint">Configure the intensity of the light source.</p>
		    </div>`
		if (!dim) content += `
			<div class="form-group">
				<label for="dim" style="line-height: 26px;">Dim (ft):</label>
				<div class="form-fields">
					<input type="range" value="40" id="dim" min="0" max="120" step="5">
					<span class="range-value" id="dimOutput">20</span>
				</div>
			</div>`
		if (!bright) content += `
			<div class="form-group">
				<label for="bright" style="line-height: 26px;">Bright (ft):</label>
				<div class="form-fields">
					<input type="range" value="20" id="bright" min="0" max="120" step="5">
					<span class="range-value" id="brightOutput">20</span>
				</div>
			</div>`
		if (!angle) content += `
			<div class="form-group">
				<label for="angle" style="line-height: 26px;">Emission Angle (Degrees):</label>
				<div class="form-fields">
					<input type="range" value="360" id="angle" min="0" max="360" step="1">
					<span class="range-value" id="angleOutput">360</span>
				</div>
				<p class="hint">Configure the angle of the light source.</p>
		    </div>`
		if (!intensity) content += `
			<div class="form-group">
				<label for="intensity" style="line-height: 26px;">Animation Intensity:</label>
				<div class="form-fields">
					<input type="range" value="1" id="intensity" min="0" max="10" step="1">
					<span class="range-value" id="intensityOutput">1</span>
				</div>
				<p class="hint">Configure the intesity of the light source's animation.</p>
		    </div>`
		if (!speed) content += `
			<div class="form-group">
				<label for="speed" style="line-height: 26px;">Animation Speed:</label>
				<div class="form-fields">
					<input type="range" value="3" id="speed" min="0" max="10" step="1">
					<span class="range-value" id="speedOutput">3</span>
				</div>
				<p class="hint">Configure the speed of the light source's animation.</p>
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
					const valueSpeed = document.querySelector("#speedOutput")
                    const inputSpeed = document.querySelector("#speed")
					if (valueSpeed && inputSpeed) {
						valueSpeed.textContent = inputSpeed.value
						inputSpeed.addEventListener("input", (event) => {
	                        valueSpeed.textContent = event.target.value
	                    })
					}
					const valueIntensity = document.querySelector("#intensityOutput")
                    const inputIntensity = document.querySelector("#intensity")
					if (valueIntensity && inputIntensity) {
						valueIntensity.textContent = inputIntensity.value
						inputIntensity.addEventListener("input", (event) => {
	                        valueIntensity.textContent = event.target.value
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
							const newType = document.querySelector("#type")?.value ?? type;
							const newIntensity = document.querySelector("#intensity")?.value ?? intensity;
							const newSpeed = document.querySelector("#speed")?.value ?? speed;
			                return {color:newColor, alpha:newAlpha, dim:newDim, bright:newBright, angle:newAngle, animation:{type:newType,instensity:newIntensity,speed:newSpeed}};
			            }
			        }
		        })
		        return lightButtons;
		    }
		}
		let updates;
		if (!!optionUpdates) updates = { token: { light: optionUpdates } };
		else updates = { token: { light: { color, alpha, dim, bright, angle, animation:{ speed, intensity, type } } } };
		const target = failedSaves[0]; //Token5e#Document
    	if (MidiSRDHelpers._hasMutation(target,mutName)) 
			await MidiQOL.socket().executeAsGM("removeEffects", {actorUuid: target.uuid, effects:[target.actor.effects.find(eff=>eff.label==="Light")?.id]})
		await warpgate.mutate(target,updates,{},{name:mutName});
		await DAE.setFlag(actor, "lightSRD", target.uuid);
    }
    if (args[0] === "off") {
		const { actor, token, lArgs } = MidiSRDHelpers._targets(args);
		if (MidiSRDHelpers._hasMutation(token,mutName)) {
			await warpgate.revert(token.document,mutName);
			await DAE.unsetFlag(fromUuidSync(lArgs.origin).actor, "lightSRD"); 
		}
	}
}	