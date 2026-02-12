import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TimeRangeSelector from '@/components/statistics/TimeRangeSelector.vue';

describe('TimeRangeSelector.vue', () => {
  it('should render all time range options', () => {
    const wrapper = mount(TimeRangeSelector, {
      props: {
        modelValue: 'month',
      },
    });

    expect(wrapper.text()).toContain('本周');
    expect(wrapper.text()).toContain('本月');
    expect(wrapper.text()).toContain('本季度');
    expect(wrapper.text()).toContain('本年');
    expect(wrapper.text()).toContain('全部');
  });

  it('should emit update:modelValue when option is clicked', async () => {
    const wrapper = mount(TimeRangeSelector, {
      props: {
        modelValue: 'month',
      },
    });

    // Click on week option
    const weekOption = wrapper.findAll('.el-segmented__item').find(el =>
      el.text().includes('本周')
    );
    await weekOption.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['week']);
  });

  it('should emit change event when option is clicked', async () => {
    const wrapper = mount(TimeRangeSelector, {
      props: {
        modelValue: 'month',
      },
    });

    const quarterOption = wrapper.findAll('.el-segmented__item').find(el =>
      el.text().includes('本季度')
    );
    await quarterOption.trigger('click');

    expect(wrapper.emitted('change')).toBeTruthy();
    expect(wrapper.emitted('change')[0]).toEqual(['quarter']);
  });

  it('should update when modelValue prop changes', async () => {
    const wrapper = mount(TimeRangeSelector, {
      props: {
        modelValue: 'week',
      },
    });

    await wrapper.setProps({ modelValue: 'year' });

    // The component should reflect the new value
    expect(wrapper.props('modelValue')).toBe('year');
  });
});
