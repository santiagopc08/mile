add_executable(
    arcade
    main.cpp
    ArcadeCommon.cpp
    ArcadeCommon.hpp
    MenuScene.cpp
    MenuScene.hpp
    BrickStormScene.cpp
    BrickStormScene.hpp
    VoidRunnerScene.cpp
    VoidRunnerScene.hpp
)

target_include_directories(
    arcade
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/../..
)

target_link_libraries(
    arcade
    PRIVATE
        platform_engine
)

if(PLATFORM_ENABLE_WARNINGS)
    set_target_warnings(arcade)
endif()
