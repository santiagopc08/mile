#ifndef PLATFORM_EDITOR_COMMANDS_ENTITY_COMMANDS_HPP
#define PLATFORM_EDITOR_COMMANDS_ENTITY_COMMANDS_HPP

#include "editor/commands/ICommand.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/scene/Scene.hpp"
#include "engine/scene/components/Components.hpp"
#include <optional>
#include <string>

namespace platform
{
    class CreateEntityCommand : public ICommand
    {
    public:
        CreateEntityCommand(Scene *scene, std::string name);

        bool Execute() override;
        bool Undo() override;
        [[nodiscard]] std::string GetName() const override { return "Create Entity"; }

        [[nodiscard]] EntityID GetCreatedEntity() const { return m_createdEntity; }

    private:
        Scene *m_scene{nullptr};
        std::string m_name;
        EntityID m_createdEntity{kNullEntity};
    };

    /// Snapshot of the components the editor knows how to author.
    struct EntitySnapshot
    {
        std::string Name{"Entity"};
        std::string Tag{"Default"};
        std::optional<TransformComponent> Transform;
        std::optional<ShapeComponent> Shape;
        std::optional<RenderLayerComponent> Layer;
        bool Visible{true};
        bool HasVisibility{false};

        static EntitySnapshot Capture(Scene &scene, EntityID entity);
        EntityID Restore(Scene &scene) const;
    };

    class DeleteEntityCommand : public ICommand
    {
    public:
        DeleteEntityCommand(Scene *scene, EntityID entity);

        bool Execute() override;
        bool Undo() override;
        [[nodiscard]] std::string GetName() const override { return "Delete Entity"; }

        [[nodiscard]] EntityID GetEntity() const { return m_entity; }

    private:
        Scene *m_scene{nullptr};
        EntityID m_entity{kNullEntity};
        std::string m_savedName;
        EntitySnapshot m_snapshot;
    };

    class DuplicateEntityCommand : public ICommand
    {
    public:
        DuplicateEntityCommand(Scene *scene, EntityID source);

        bool Execute() override;
        bool Undo() override;
        [[nodiscard]] std::string GetName() const override { return "Duplicate Entity"; }

        [[nodiscard]] EntityID GetCreatedEntity() const { return m_createdEntity; }

    private:
        Scene *m_scene{nullptr};
        EntitySnapshot m_snapshot;
        EntityID m_createdEntity{kNullEntity};
    };
}

#endif // PLATFORM_EDITOR_COMMANDS_ENTITY_COMMANDS_HPP
