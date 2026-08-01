#ifndef PLATFORM_ENGINE_GAMEPLAY_MODIFIERS_MODIFIER_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_MODIFIERS_MODIFIER_SYSTEM_HPP

#include "engine/gameplay/modifiers/ModifierSettingsComponent.hpp"
#include "engine/gameplay/modifiers/ModifierRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"

namespace platform
{
    class ModifierSystem : public IRuntimeProfiler
    {
    public:
        ModifierSystem() = default;

        void applyModifier(Registry &registry, EntityID entity, uint32_t id, ModifierType type, float value, ModifierOperation op, float duration = 0.0f);
        void removeModifier(Registry &registry, EntityID entity, uint32_t id);
        bool hasModifier(Registry &registry, EntityID entity, uint32_t id) const;
        void clearModifiers(Registry &registry, EntityID entity);

        void Update(Registry &registry, double dt);

        [[nodiscard]] float calculateModifiedValue(Registry &registry, EntityID entity, ModifierType type, float baseValue) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_MODIFIERS_MODIFIER_SYSTEM_HPP
