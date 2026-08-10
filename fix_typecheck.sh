sed -i 's/onClick={() => handleAddReaction(session.id, rxType)}/onClick={() => handleAddReaction(session.id, rxType as ReactionType)}/g' src/components/health/movement/ActivitySessionItem.tsx
sed -i "s/process.env.NODE_ENV = 'development'/vi.stubEnv('NODE_ENV', 'development')/g" tests/lib/haptics.test.ts
sed -i "s/process.env.NODE_ENV = 'production'/vi.stubEnv('NODE_ENV', 'production')/g" tests/lib/haptics.test.ts
sed -i "s/process.env.NODE_ENV = 'test'/vi.unstubAllEnvs()/g" tests/lib/haptics.test.ts
sed -i "s/process.env.NODE_ENV = originalNodeEnv;/vi.unstubAllEnvs();/g" tests/lib/haptics.test.ts
