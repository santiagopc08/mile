#include "engine/scene/Scene.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    Scene::Scene() = default;

    Scene::Scene(std::string_view name)
    {
        m_metadata.Name = std::string(name);
    }

    Scene::~Scene()
    {
        if (m_state != SceneState::Shutdown && m_state != SceneState::Created)
        {
            Shutdown();
        }
    }

    bool Scene::Initialize()
    {
        if (m_state != SceneState::Created)
        {
            return true;
        }

        LOG_INFO("[Scene] Initializing scene '{}'...", m_metadata.Name);
        OnInitialize();
        m_state = SceneState::Initialized;
        LOG_INFO("[Scene] Scene '{}' initialized.", m_metadata.Name);
        return true;
    }

    void Scene::Activate()
    {
        if (m_state == SceneState::Initialized || m_state == SceneState::Inactive)
        {
            LOG_INFO("[Scene] Activating scene '{}'...", m_metadata.Name);
            OnActivate();
            m_state = SceneState::Active;
        }
    }

    void Scene::Update(double dt)
    {
        if (m_state != SceneState::Active)
        {
            return;
        }

        OnUpdate(dt);
        m_transformSystem.Update(m_registry, dt);

        // Deferred entity destruction at end of frame
        m_registry.FlushDestroyedEntities();
    }

    void Scene::FixedUpdate(double fixedDt)
    {
        if (m_state != SceneState::Active)
        {
            return;
        }

        OnFixedUpdate(fixedDt);
    }

    void Scene::PrepareRender()
    {
        if (m_state == SceneState::Active)
        {
            m_transformSystem.PrepareRenderTransforms(m_registry);
        }
    }

    void Scene::Render(Renderer &renderer)
    {
        if (m_state == SceneState::Active)
        {
            OnRender(renderer);
        }
    }

    void Scene::Deactivate()
    {
        if (m_state == SceneState::Active)
        {
            LOG_INFO("[Scene] Deactivating scene '{}'...", m_metadata.Name);
            OnDeactivate();
            m_state = SceneState::Inactive;
        }
    }

    void Scene::Shutdown()
    {
        if (m_state != SceneState::Shutdown)
        {
            if (m_state == SceneState::Active)
            {
                Deactivate();
            }

            LOG_INFO("[Scene] Shutting down scene '{}'...", m_metadata.Name);
            OnShutdown();
            m_registry.Clear();
            m_state = SceneState::Shutdown;
            LOG_INFO("[Scene] Scene '{}' shutdown complete.", m_metadata.Name);
        }
    }

    EntityID Scene::CreateEntity(const std::string &name)
    {
        return m_registry.CreateEntity(name);
    }

    void Scene::DestroyEntity(EntityID entity)
    {
        m_registry.DestroyEntity(entity);
    }
}
