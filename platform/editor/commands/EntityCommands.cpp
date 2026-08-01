#include "editor/commands/EntityCommands.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/scene/components/Components.hpp"

namespace platform
{
    EntitySnapshot EntitySnapshot::Capture(Scene &scene, EntityID entity)
    {
        EntitySnapshot snapshot;
        auto &registry = scene.GetRegistry();

        if (const auto *name = registry.GetComponent<NameComponent>(entity))
        {
            snapshot.Name = name->Name;
        }
        if (const auto *tag = registry.GetComponent<TagComponent>(entity))
        {
            snapshot.Tag = tag->Tag;
        }
        if (const auto *transform = registry.GetComponent<TransformComponent>(entity))
        {
            snapshot.Transform = *transform;
        }
        if (const auto *shape = registry.GetComponent<ShapeComponent>(entity))
        {
            snapshot.Shape = *shape;
        }
        if (const auto *layer = registry.GetComponent<RenderLayerComponent>(entity))
        {
            snapshot.Layer = *layer;
        }
        if (const auto *visibility = registry.GetComponent<VisibilityComponent>(entity))
        {
            snapshot.HasVisibility = true;
            snapshot.Visible = visibility->Visible;
        }

        return snapshot;
    }

    EntityID EntitySnapshot::Restore(Scene &scene) const
    {
        auto &registry = scene.GetRegistry();
        const EntityID entity = registry.CreateEntity(Name);

        if (auto *tag = registry.GetComponent<TagComponent>(entity))
        {
            tag->Tag = Tag;
        }
        if (Transform)
        {
            registry.AddComponent<TransformComponent>(entity) = *Transform;
        }
        if (Shape)
        {
            registry.AddComponent<ShapeComponent>(entity) = *Shape;
        }
        if (Layer)
        {
            registry.AddComponent<RenderLayerComponent>(entity) = *Layer;
        }
        if (HasVisibility)
        {
            registry.AddComponent<VisibilityComponent>(entity).Visible = Visible;
        }

        return entity;
    }

    CreateEntityCommand::CreateEntityCommand(Scene *scene, std::string name)
        : m_scene(scene), m_name(std::move(name))
    {
    }

    bool CreateEntityCommand::Execute()
    {
        if (!m_scene) return false;
        m_createdEntity = m_scene->GetRegistry().CreateEntity(m_name.empty() ? "New Entity" : m_name);
        return true;
    }

    bool CreateEntityCommand::Undo()
    {
        if (!m_scene || m_createdEntity == kNullEntity) return false;
        m_scene->GetRegistry().DestroyEntity(m_createdEntity);
        m_scene->GetRegistry().FlushDestroyedEntities();
        m_createdEntity = kNullEntity;
        return true;
    }

    DeleteEntityCommand::DeleteEntityCommand(Scene *scene, EntityID entity)
        : m_scene(scene), m_entity(entity)
    {
        if (m_scene)
        {
            if (auto *nameComp = m_scene->GetRegistry().GetComponent<NameComponent>(m_entity))
            {
                m_savedName = nameComp->Name;
            }
            m_snapshot = EntitySnapshot::Capture(*m_scene, m_entity);
        }
    }

    bool DeleteEntityCommand::Execute()
    {
        if (!m_scene || m_entity == kNullEntity) return false;
        m_scene->GetRegistry().DestroyEntity(m_entity);
        m_scene->GetRegistry().FlushDestroyedEntities();
        return true;
    }

    bool DeleteEntityCommand::Undo()
    {
        if (!m_scene) return false;
        // Restoring rebuilds the components too, not just the name.
        m_entity = m_snapshot.Restore(*m_scene);
        return true;
    }

    DuplicateEntityCommand::DuplicateEntityCommand(Scene *scene, EntityID source)
        : m_scene(scene)
    {
        if (m_scene)
        {
            m_snapshot = EntitySnapshot::Capture(*m_scene, source);
            m_snapshot.Name += " Copy";
            if (m_snapshot.Transform)
            {
                // Offset the copy so it does not hide exactly behind the original.
                m_snapshot.Transform->Position += glm::vec2{40.0f, 40.0f};
            }
        }
    }

    bool DuplicateEntityCommand::Execute()
    {
        if (!m_scene) return false;
        m_createdEntity = m_snapshot.Restore(*m_scene);
        return true;
    }

    bool DuplicateEntityCommand::Undo()
    {
        if (!m_scene || m_createdEntity == kNullEntity) return false;
        m_scene->GetRegistry().DestroyEntity(m_createdEntity);
        m_scene->GetRegistry().FlushDestroyedEntities();
        m_createdEntity = kNullEntity;
        return true;
    }
}
