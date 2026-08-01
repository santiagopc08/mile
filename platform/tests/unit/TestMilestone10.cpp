#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>

#include "engine/audio/AudioEngine.hpp"
#include "engine/audio/AudioDevice.hpp"
#include "engine/audio/AudioSource.hpp"
#include "engine/audio/AudioListener.hpp"
#include "engine/audio/assets/AudioBank.hpp"
#include "engine/audio/assets/AudioSample.hpp"
#include "engine/audio/bus/AudioBusSystem.hpp"
#include "engine/audio/spatial/SpatialAudio2D.hpp"
#include "engine/audio/music/MusicSystem.hpp"
#include "engine/audio/settings/AudioSettings.hpp"
#include "engine/audio/events/AudioEvents.hpp"
#include "examples/hill_climb/AudioValidationScene.hpp"

TEST_CASE("AudioDevice Initialization", "[Audio]")
{
    platform::AudioDevice device;
    platform::AudioConfiguration config;
    config.DeviceName = "Test Output";
    config.SampleRate = 44100;

    REQUIRE(device.Initialize(config));
    REQUIRE(device.IsInitialized());
    REQUIRE(device.GetConfiguration().SampleRate == 44100);

    device.Shutdown();
    REQUIRE(!device.IsInitialized());
}

TEST_CASE("AudioBank Asset Caching without Duplicates", "[Audio]")
{
    platform::AudioBank bank;
    platform::AudioSample sample = platform::AudioSample::CreateSyntheticTone("TestTone", 440.0f, 1.0);
    platform::SoundAsset sound("TestTone", sample);

    REQUIRE(bank.RegisterSound("TestTone", sound));
    REQUIRE(bank.GetSoundCount() == 1);

    // Re-registering existing sound increments ref count without duplicate allocation
    REQUIRE(bank.RegisterSound("TestTone", sound));
    REQUIRE(bank.GetSoundCount() == 1);
    REQUIRE(bank.GetSound("TestTone")->GetRefCount() == 2);
}

TEST_CASE("AudioBus Hierarchy & Gain Calculation", "[Audio]")
{
    platform::AudioBusSystem busSystem;
    busSystem.Initialize();

    busSystem.SetBusVolume(platform::AudioBusType::Master, 0.8f);
    busSystem.SetBusVolume(platform::AudioBusType::SFX, 0.5f);

    // SFX effective volume = Master (0.8) * SFX (0.5) = 0.4
    REQUIRE(busSystem.GetBusEffectiveVolume(platform::AudioBusType::SFX) == Catch::Approx(0.4f));

    // Muting Master mutes all child buses
    busSystem.SetBusMute(platform::AudioBusType::Master, true);
    REQUIRE(busSystem.GetBusEffectiveVolume(platform::AudioBusType::SFX) == Catch::Approx(0.0f));
}

TEST_CASE("2D Spatial Attenuation and Stereo Panning", "[Audio]")
{
    platform::AudioListener listener(glm::vec2(0.0f, 0.0f));
    platform::AudioSource source(1, "TestSound");
    source.SetSpatial(true);
    source.SetMinDistance(10.0f);
    source.SetMaxDistance(100.0f);

    // 1. Source at listener position -> Max volume, center pan
    source.SetPosition(glm::vec2(0.0f, 0.0f));
    platform::SpatialAudio2D::Evaluate(source, listener);
    REQUIRE(source.GetEffectiveVolume() == Catch::Approx(1.0f));
    REQUIRE(source.GetStereoPan() == Catch::Approx(0.0f));

    // 2. Source 55m to the right -> Linear falloff (50% volume), pan right (> 0)
    source.SetPosition(glm::vec2(55.0f, 0.0f));
    platform::SpatialAudio2D::Evaluate(source, listener);
    REQUIRE(source.GetEffectiveVolume() == Catch::Approx(0.5f));
    REQUIRE(source.GetStereoPan() > 0.0f);
}

TEST_CASE("MusicSystem State Machine and Crossfading", "[Audio]")
{
    platform::MusicSystem musicSystem;
    REQUIRE(musicSystem.GetCurrentState() == platform::MusicState::Gameplay);

    musicSystem.SetState(platform::MusicState::Pause, 0.2);
    REQUIRE(musicSystem.IsCrossfading());
    REQUIRE(musicSystem.GetCurrentState() == platform::MusicState::Pause);

    musicSystem.Update(0.25, nullptr); // Advance time past fade duration
    REQUIRE(!musicSystem.IsCrossfading());
}

TEST_CASE("AudioSettings Configuration Propagation", "[Audio]")
{
    platform::AudioBusSystem busSystem;
    busSystem.Initialize();

    platform::AudioSettings settings;
    settings.SetMasterVolume(0.9f, &busSystem);
    settings.SetMusicVolume(0.4f, &busSystem);

    REQUIRE(busSystem.GetBus(platform::AudioBusType::Master)->GetVolume() == Catch::Approx(0.9f));
    REQUIRE(busSystem.GetBus(platform::AudioBusType::Music)->GetVolume() == Catch::Approx(0.4f));
}

TEST_CASE("AudioValidationScene Lifecycle", "[AudioScene]")
{
    platform::AudioValidationScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());
    REQUIRE(scene.GetAudioEngine().IsInitialized());

    scene.Update(0.016);

    scene.Deactivate();
    scene.Shutdown();
}
