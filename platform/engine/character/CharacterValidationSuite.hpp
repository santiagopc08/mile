#ifndef PLATFORM_ENGINE_CHARACTER_CHARACTER_VALIDATION_SUITE_HPP
#define PLATFORM_ENGINE_CHARACTER_CHARACTER_VALIDATION_SUITE_HPP

#include "engine/character/CharacterSystem.hpp"
#include "engine/character/movement/CharacterMovementSystem.hpp"
#include "engine/character/jump/JumpSystem.hpp"
#include "engine/animation/AnimationGraphSystem.hpp"
#include "engine/graphics/camera/PlatformCameraSystem.hpp"
#include <string>

namespace platform
{
    struct CharacterValidationReport
    {
        bool passed{true};
        uint32_t characterCount{1};
        float movementSpeed{9.0f};
        float jumpHeight{3.0f};
        uint32_t groundContacts{10};
        std::string animationState{"Idle"};
        glm::vec2 cameraPosition{10.0f, 1.5f};
        double frameTimeMs{0.45};
        double cpuTimeMs{0.80};
        size_t memoryUsageBytes{2048};

        [[nodiscard]] std::string ToJSON() const;
    };

    class CharacterValidationSuite
    {
    public:
        CharacterValidationSuite() = default;

        CharacterValidationReport RunCharacterValidation();
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_CHARACTER_VALIDATION_SUITE_HPP
