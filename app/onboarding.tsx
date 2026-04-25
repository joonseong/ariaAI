import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/hooks/useOnboarding';
import { TagChip } from '@/components/artwork/TagChip';
import { Avatar } from '@/components/common/Avatar';
import FollowButton from '@/components/artist/FollowButton';
import { TOOL_PRESETS } from '@/hooks/useArtworkUpload';
import { Button } from '@/components/common/Button';

const TOTAL_STEPS = 3;

const RECOMMENDED_ARTISTS = [
  { id: 'artist-1', nickname: '달빛작가', bio: 'Midjourney로 몽환적인 세계를 그립니다', profileImageUrl: null },
  { id: 'artist-2', nickname: '픽셀마법사', bio: 'Stable Diffusion 전문', profileImageUrl: null },
  { id: 'artist-3', nickname: '꿈의화가', bio: 'DALL-E로 초현실적 작품 창작', profileImageUrl: null },
  { id: 'artist-4', nickname: '별빛크리에이터', bio: 'ComfyUI 파이프라인 탐구자', profileImageUrl: null },
  { id: 'artist-5', nickname: '아트마법사', bio: 'AI 아트의 무한한 가능성을 탐구합니다', profileImageUrl: null },
];

function StepDots({ step }: { step: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2 py-4">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          className={`h-2 rounded-full ${
            i === step ? 'w-6 bg-accent-primary' : 'w-2 bg-elevated'
          }`}
        />
      ))}
    </View>
  );
}

function WelcomeStep() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="mb-8 h-48 w-48 items-center justify-center rounded-3xl bg-elevated">
        <Text className="text-6xl">🎨</Text>
      </View>
      <Text className="mb-3 text-center text-2xl font-bold text-text-primary">
        환영합니다!
      </Text>
      <Text className="text-center text-base text-text-secondary">
        Aria에서 AI 작품을 공유하고{'\n'}다양한 작가들을 만나보세요
      </Text>
    </View>
  );
}

interface ToolStepProps {
  selectedTools: string[];
  onToggle: (tool: string) => void;
}

function ToolStep({ selectedTools, onToggle }: ToolStepProps) {
  return (
    <View className="flex-1 px-6 pt-8">
      <Text className="mb-2 text-2xl font-bold text-text-primary">
        관심 도구를 선택해주세요
      </Text>
      <Text className="mb-8 text-sm text-text-secondary">
        선택하신 도구의 인기 작품을 먼저 보여드립니다 (선택 사항)
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {TOOL_PRESETS.map((tool) => (
          <TagChip
            key={tool}
            label={tool}
            selected={selectedTools.includes(tool)}
            onPress={() => onToggle(tool)}
          />
        ))}
      </View>
    </View>
  );
}

function ArtistStep() {
  return (
    <View className="flex-1 px-6 pt-8">
      <Text className="mb-2 text-2xl font-bold text-text-primary">
        추천 작가를 팔로우해보세요
      </Text>
      <Text className="mb-6 text-sm text-text-secondary">
        팔로우하면 새 작품 소식을 가장 먼저 받아볼 수 있어요 (선택 사항)
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {RECOMMENDED_ARTISTS.map((artist) => (
            <View
              key={artist.id}
              className="flex-row items-center rounded-xl bg-surface p-4"
            >
              <Avatar
                uri={artist.profileImageUrl}
                size={48}
                fallbackText={artist.nickname}
              />
              <View className="mx-3 flex-1">
                <Text className="text-sm font-semibold text-text-primary">
                  {artist.nickname}
                </Text>
                <Text className="mt-0.5 text-xs text-text-secondary" numberOfLines={1}>
                  {artist.bio}
                </Text>
              </View>
              <FollowButton
                targetUserId={artist.id}
                initialFollowing={false}
                initialFollowersCount={0}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function OnboardingScreen(): React.JSX.Element {
  const { step, selectedTools, setSelectedTools, complete, skip, nextStep } = useOnboarding();

  const isLastStep = step === TOTAL_STEPS - 1;

  const handleToolToggle = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const handleNext = async () => {
    if (isLastStep) {
      await complete();
    } else {
      nextStep();
    }
  };

  const handleSkip = async () => {
    await skip();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StepDots step={step} />

      {step === 0 && <WelcomeStep />}
      {step === 1 && (
        <ToolStep selectedTools={selectedTools} onToggle={handleToolToggle} />
      )}
      {step === 2 && <ArtistStep />}

      <View className="gap-3 px-6 pb-6 pt-4">
        <Button
          title={isLastStep ? '시작하기' : '다음'}
          onPress={handleNext}
          fullWidth
        />
        {step > 0 && (
          <Pressable
            onPress={handleSkip}
            className="items-center py-2"
            accessibilityRole="button"
          >
            <Text className="text-sm text-text-secondary">건너뛰기</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
