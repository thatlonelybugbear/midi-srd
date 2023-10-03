Done:
aid
animateDead
banishment
bracersArchery  .. move it to itemsMacros.mjs
confusion



Blessed Healer infrastructure.
the new flags work for spells with 1 target only.
For Mass Cure Wounds if the flag evaluated true for first target, it will apply to all.
Might need to exclude target from the spell and then applyTokenDamage for that one specifically (if target hp === 0, updateTokenTargets(!target), and then applyTokenDamage to that one.)
Blessed healer automation. actor onuse if workflow.targets.size > 1 check if any of the targets is at 0 HP, exclude that one from the main spell roll, and then applyTokenDamage for max healing to that one (or more than 1 if needed)






TO DO 

Contagion make the rolling of a save an OverTime effect and the macroName called after

Recreate fleshToStone like Contagion




