#include "engine/scene/SceneManager.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    SceneManager::SceneManager() = default;

    SceneManager::~SceneManager()
    {
        UnloadScene();
    }

    bool SceneManager::LoadScene(std::unique_ptr<Scene> scene)
    {
        if (!scene)
        {
            LOG_ERROR("[SceneManager] Cannot load null scene.");
            return false;
        }

        if (m_activeScene)
        {
            UnloadScene();
        }

        m_activeScene = std::move(scene);
        if (!m_activeScene->Initialize())
        {
            LOG_ERROR("[SceneManager] Failed to initialize scene.");
            m_activeScene.reset();
            return false;
        }

        m_activeScene->Activate();
        LOG_INFO("[SceneManager] Scene '{}' loaded and active.", m_activeScene->GetMetadata().Name);
        return true;
    }

    void SceneManager::UnloadScene()
    {
        if (m_activeScene)
        {
            LOG_INFO("[SceneManager] Unloading scene '{}'...", m_activeScene->GetMetadata().Name);
            m_activeScene->Deactivate();
            m_activeScene->Shutdown();
            m_activeScene.reset();
        }
    }

    bool SceneManager::SwitchScene(std::unique_ptr<Scene> newScene)
    {
        LOG_INFO("[SceneManager] Switching scene...");
        return LoadScene(std::move(newScene));
    }

    bool SceneManager::RestartScene()
    {
        if (!m_activeScene)
        {
            return false;
        }

        LOG_INFO("[SceneManager] Restarting scene '{}'...", m_activeScene->GetMetadata().Name);
        m_activeScene->Deactivate();
        m_activeScene->Shutdown();

        if (!m_activeScene->Initialize())
        {
            return false;
        }

        m_activeScene->Activate();
        return true;
    }

    void SceneManager::Update(double dt)
    {
        if (m_activeScene && m_activeScene->IsActive())
        {
            m_activeScene->Update(dt);
        }
    }

    void SceneManager::FixedUpdate(double fixedDt)
    {
        if (m_activeScene && m_activeScene->IsActive())
        {
            m_activeScene->FixedUpdate(fixedDt);
        }
    }

    void SceneManager::PrepareRender()
    {
        if (m_activeScene && m_activeScene->IsActive())
        {
            m_activeScene->PrepareRender();
        }
    }
}
