include(${CMAKE_CURRENT_LIST_DIR}/CPM.cmake)

# SDL3
CPMAddPackage(
    NAME SDL3
    URL https://github.com/libsdl-org/SDL/archive/refs/tags/release-3.2.0.tar.gz
    OPTIONS
        "SDL_SHARED OFF"
        "SDL_STATIC ON"
        "SDL_TEST OFF"
        "SDL_TESTS OFF"
        "SDL_WERROR OFF"
)

# GLM
CPMAddPackage(
    NAME glm
    URL https://github.com/g-truc/glm/archive/refs/tags/1.0.1.tar.gz
)

# spdlog using C++23 std::format
CPMAddPackage(
    NAME spdlog
    URL https://github.com/gabime/spdlog/archive/refs/tags/v1.14.1.tar.gz
    OPTIONS
        "SPDLOG_USE_STD_FORMAT ON"
        "SPDLOG_BUILD_TESTS OFF"
        "SPDLOG_BUILD_EXAMPLE OFF"
)

# Box2D
CPMAddPackage(
    NAME box2d
    URL https://github.com/erincatto/box2d/archive/refs/tags/v2.4.1.tar.gz
    OPTIONS
        "BOX2D_BUILD_SAMPLES OFF"
        "BOX2D_BUILD_DOCS OFF"
        "BOX2D_BUILD_UNIT_TESTS OFF"
        "BOX2D_BUILD_TESTS OFF"
)

# Catch2
if(PLATFORM_BUILD_TESTS)
    CPMAddPackage(
        NAME Catch2
        URL https://github.com/catchorg/Catch2/archive/refs/tags/v3.5.2.tar.gz
        OPTIONS
            "CATCH_DEVELOPMENT_BUILD OFF"
            "BUILD_TESTING OFF"
    )
endif()
