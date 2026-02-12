import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import StudyAdvice from '@/components/statistics/StudyAdvice.vue';

describe('StudyAdvice.vue', () => {
  const mockAdviceData = [
    {
      type: 'success',
      title: '学习进步明显',
      message: '本周正确率提升了15%',
    },
    {
      type: 'warning',
      title: '物理需加强',
      message: '物理正确率有所下降',
    },
    {
      type: 'error',
      title: '复习不足',
      message: '本周没有进行复习',
    },
    {
      type: 'info',
      title: '学习建议',
      message: '建议增加学习时间',
    },
  ];

  it('should render all advice items', () => {
    const wrapper = mount(StudyAdvice, {
      props: {
        data: mockAdviceData,
        loading: false,
      },
    });

    expect(wrapper.findAll('.advice-item')).toHaveLength(4);
  });

  it('should show empty state when no advice', () => {
    const wrapper = mount(StudyAdvice, {
      props: {
        data: [],
        loading: false,
      },
    });

    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('暂无学习建议');
  });

  it('should apply correct styles for each advice type', () => {
    const wrapper = mount(StudyAdvice, {
      props: {
        data: mockAdviceData,
        loading: false,
      },
    });

    const items = wrapper.findAll('.advice-item');

    expect(items[0].classes()).toContain('advice-success');
    expect(items[1].classes()).toContain('advice-warning');
    expect(items[2].classes()).toContain('advice-error');
    expect(items[3].classes()).toContain('advice-info');
  });

  it('should show loading state', () => {
    const wrapper = mount(StudyAdvice, {
      props: {
        data: [],
        loading: true,
      },
    });

    expect(wrapper.find('.el-loading-mask').exists()).toBe(true);
  });

  it('should display advice title and message', () => {
    const wrapper = mount(StudyAdvice, {
      props: {
        data: mockAdviceData,
        loading: false,
      },
    });

    const firstItem = wrapper.find('.advice-item');
    expect(firstItem.text()).toContain('学习进步明显');
    expect(firstItem.text()).toContain('本周正确率提升了15%');
  });

  it('should show correct icon for each type', () => {
    const wrapper = mount(StudyAdvice, {
      props: {
        data: mockAdviceData,
        loading: false,
      },
    });

    const items = wrapper.findAll('.advice-item');

    // Check for icon elements
    expect(items[0].find('.advice-icon').exists()).toBe(true);
    expect(items[1].find('.advice-icon').exists()).toBe(true);
    expect(items[2].find('.advice-icon').exists()).toBe(true);
    expect(items[3].find('.advice-icon').exists()).toBe(true);
  });
});
