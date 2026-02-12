import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import OverviewCards from '@/components/statistics/OverviewCards.vue';

// Mock ECharts components
vi.mock('echarts', () => ({
  default: {
    init: vi.fn(() => ({
      setOption: vi.fn(),
      resize: vi.fn(),
      dispose: vi.fn(),
    })),
  },
}));

describe('OverviewCards.vue', () => {
  const mockData = {
    totalQuestions: 156,
    correctCount: 128,
    wrongCount: 28,
    accuracy: 82,
    totalTime: 12450,
    studyDays: 45,
    avgDailyTime: 277,
  };

  it('should render all 8 stat cards', () => {
    const wrapper = mount(OverviewCards, {
      props: {
        data: mockData,
        loading: false,
      },
    });

    expect(wrapper.findAll('.stat-card')).toHaveLength(8);
  });

  it('should display correct values', () => {
    const wrapper = mount(OverviewCards, {
      props: {
        data: mockData,
        loading: false,
      },
    });

    expect(wrapper.text()).toContain('156'); // totalQuestions
    expect(wrapper.text()).toContain('128'); // correctCount
    expect(wrapper.text()).toContain('28'); // wrongCount
    expect(wrapper.text()).toContain('82%'); // accuracy
  });

  it('should show loading state', () => {
    const wrapper = mount(OverviewCards, {
      props: {
        data: {},
        loading: true,
      },
    });

    expect(wrapper.find('.el-loading-mask').exists()).toBe(true);
  });

  it('should format time correctly', () => {
    const wrapper = mount(OverviewCards, {
      props: {
        data: {
          ...mockData,
          totalTime: 3665, // 1 hour 1 minute 5 seconds
        },
        loading: false,
      },
    });

    expect(wrapper.text()).toContain('1小时1分');
  });

  it('should calculate efficiency correctly', () => {
    const wrapper = mount(OverviewCards, {
      props: {
        data: {
          ...mockData,
          totalTime: 7200, // 2 hours
        },
        loading: false,
      },
    });

    // 156 questions / 2 hours = 78 questions/hour
    expect(wrapper.text()).toContain('78');
  });

  it('should handle empty data', () => {
    const wrapper = mount(OverviewCards, {
      props: {
        data: {},
        loading: false,
      },
    });

    // Should show 0 for empty values
    expect(wrapper.text()).toContain('0');
  });
});
