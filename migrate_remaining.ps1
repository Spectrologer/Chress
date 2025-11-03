# PowerShell script to migrate remaining JS files to TS

$files = @(
    @{src="src/core/AnimationCoordinator.js"; dest="src/core/AnimationCoordinator.ts"},
    @{src="src/core/AnimationScheduler.js"; dest="src/core/AnimationScheduler.ts"},
    @{src="src/core/SoundManager.js"; dest="src/core/SoundManager.ts"},
    @{src="src/core/ZoneGenerator.js"; dest="src/core/ZoneGenerator.ts"},
    @{src="src/core/regionNotes.js"; dest="src/core/regionNotes.ts"},
    @{src="src/core/zoneMutators.js"; dest="src/core/zoneMutators.ts"},
    @{src="src/core/zoneSpawnManager.js"; dest="src/core/zoneSpawnManager.ts"},
    @{src="src/core/ZoneStateRestorer.js"; dest="src/core/ZoneStateRestorer.ts"},
    @{src="src/core/EventValidator.js"; dest="src/core/EventValidator.ts"},
    @{src="src/core/handlers/BaseZoneHandler.js"; dest="src/core/handlers/BaseZoneHandler.ts"},
    @{src="src/core/handlers/SurfaceHandler.js"; dest="src/core/handlers/SurfaceHandler.ts"},
    @{src="src/core/handlers/InteriorHandler.js"; dest="src/core/handlers/InteriorHandler.ts"},
    @{src="src/core/handlers/UndergroundHandler.js"; dest="src/core/handlers/UndergroundHandler.ts"},
    @{src="src/core/commands/BaseCommand.js"; dest="src/core/commands/BaseCommand.ts"},
    @{src="src/core/commands/CommandRegistry.js"; dest="src/core/commands/CommandRegistry.ts"},
    @{src="src/core/commands/commandSetup.js"; dest="src/core/commands/commandSetup.ts"},
    @{src="src/core/commands/SpawnPositionHelper.js"; dest="src/core/commands/SpawnPositionHelper.ts"},
    @{src="src/core/commands/spawn/BaseSpawnCommand.js"; dest="src/core/commands/spawn/BaseSpawnCommand.ts"},
    @{src="src/core/commands/spawn/SpawnCommands.js"; dest="src/core/commands/spawn/SpawnCommands.ts"},
    @{src="src/core/commands/spawn/EnemySpawnCommands.js"; dest="src/core/commands/spawn/EnemySpawnCommands.ts"},
    @{src="src/core/commands/utility/UtilityCommands.js"; dest="src/core/commands/utility/UtilityCommands.ts"},
    @{src="src/core/sound/MusicController.js"; dest="src/core/sound/MusicController.ts"},
    @{src="src/core/sound/ProceduralSoundGenerator.js"; dest="src/core/sound/ProceduralSoundGenerator.ts"},
    @{src="src/core/sound/SoundLifecycleManager.js"; dest="src/core/sound/SoundLifecycleManager.ts"},
    @{src="src/core/consoleCommands.js"; dest="src/core/consoleCommands.ts"},
    @{src="src/core/consoleCommandsRegistry.js"; dest="src/core/consoleCommandsRegistry.ts"},
    @{src="src/core/consoleCommandsGenerator.js"; dest="src/core/consoleCommandsGenerator.ts"}
)

Write-Host "Migration script created. Run with: pwsh migrate_remaining.ps1"
