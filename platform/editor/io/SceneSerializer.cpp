#include "editor/io/SceneSerializer.hpp"

#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/scene/components/Components.hpp"

#include <fstream>
#include <sstream>

namespace platform
{
    bool SceneSerializer::Save(Scene &scene, const std::string &filePath, std::string &outError)
    {
        std::ofstream file(filePath, std::ios::trunc);
        if (!file.is_open())
        {
            outError = "Could not open '" + filePath + "' for writing.";
            return false;
        }

        auto &registry = scene.GetRegistry();

        file << "SCENE " << scene.GetMetadata().Name << '\n';

        for (EntityID entity : registry.GetAliveEntities())
        {
            file << "ENTITY\n";

            if (const auto *name = registry.GetComponent<NameComponent>(entity))
            {
                file << "NAME " << name->Name << '\n';
            }
            if (const auto *tag = registry.GetComponent<TagComponent>(entity))
            {
                file << "TAG " << tag->Tag << '\n';
            }
            if (const auto *transform = registry.GetComponent<TransformComponent>(entity))
            {
                file << "TRANSFORM " << transform->Position.x << ' ' << transform->Position.y << ' '
                     << transform->Rotation << ' ' << transform->Scale.x << ' ' << transform->Scale.y << '\n';
            }
            if (const auto *shape = registry.GetComponent<ShapeComponent>(entity))
            {
                file << "SHAPE " << shape->Size.x << ' ' << shape->Size.y << ' '
                     << shape->Color.r << ' ' << shape->Color.g << ' ' << shape->Color.b << ' ' << shape->Color.a << '\n';
            }
            if (const auto *layer = registry.GetComponent<RenderLayerComponent>(entity))
            {
                file << "LAYER " << layer->LayerID << ' ' << layer->OrderInLayer << '\n';
            }
            if (const auto *visibility = registry.GetComponent<VisibilityComponent>(entity))
            {
                file << "VISIBLE " << (visibility->Visible ? 1 : 0) << '\n';
            }

            file << "END\n";
        }

        if (!file.good())
        {
            outError = "Write to '" + filePath + "' failed.";
            return false;
        }

        outError.clear();
        return true;
    }

    bool SceneSerializer::Load(Scene &scene, const std::string &filePath, std::string &outError)
    {
        std::ifstream file(filePath);
        if (!file.is_open())
        {
            outError = "No scene file at '" + filePath + "'.";
            return false;
        }

        auto &registry = scene.GetRegistry();
        registry.Clear();

        EntityID current = kNullEntity;
        std::string line;

        while (std::getline(file, line))
        {
            if (line.empty())
            {
                continue;
            }

            std::istringstream stream(line);
            std::string token;
            stream >> token;

            if (token == "ENTITY")
            {
                current = registry.CreateEntity();
            }
            else if (token == "END")
            {
                current = kNullEntity;
            }
            else if (current == kNullEntity)
            {
                continue; // SCENE header and any stray lines
            }
            else if (token == "NAME")
            {
                std::string name;
                std::getline(stream >> std::ws, name);
                if (auto *comp = registry.GetComponent<NameComponent>(current))
                {
                    comp->Name = name;
                }
            }
            else if (token == "TAG")
            {
                std::string tag;
                std::getline(stream >> std::ws, tag);
                if (auto *comp = registry.GetComponent<TagComponent>(current))
                {
                    comp->Tag = tag;
                }
            }
            else if (token == "TRANSFORM")
            {
                auto &transform = registry.HasComponent<TransformComponent>(current)
                    ? *registry.GetComponent<TransformComponent>(current)
                    : registry.AddComponent<TransformComponent>(current);
                stream >> transform.Position.x >> transform.Position.y >> transform.Rotation
                       >> transform.Scale.x >> transform.Scale.y;
                transform.MarkDirty();
            }
            else if (token == "SHAPE")
            {
                auto &shape = registry.HasComponent<ShapeComponent>(current)
                    ? *registry.GetComponent<ShapeComponent>(current)
                    : registry.AddComponent<ShapeComponent>(current);
                stream >> shape.Size.x >> shape.Size.y
                       >> shape.Color.r >> shape.Color.g >> shape.Color.b >> shape.Color.a;
            }
            else if (token == "LAYER")
            {
                auto &layer = registry.HasComponent<RenderLayerComponent>(current)
                    ? *registry.GetComponent<RenderLayerComponent>(current)
                    : registry.AddComponent<RenderLayerComponent>(current);
                stream >> layer.LayerID >> layer.OrderInLayer;
            }
            else if (token == "VISIBLE")
            {
                auto &visibility = registry.HasComponent<VisibilityComponent>(current)
                    ? *registry.GetComponent<VisibilityComponent>(current)
                    : registry.AddComponent<VisibilityComponent>(current);
                int value = 1;
                stream >> value;
                visibility.Visible = value != 0;
            }
        }

        outError.clear();
        return true;
    }
}
