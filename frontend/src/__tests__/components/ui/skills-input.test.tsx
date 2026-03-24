import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SkillsInput } from '@/components/ui/skills-input';

describe('SkillsInput', () => {
  it('renders existing skills as tags', () => {
    render(<SkillsInput value={['React', 'TypeScript']} onChange={() => {}} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('adds a skill on Enter key', async () => {
    const onChange = vi.fn();
    render(<SkillsInput value={[]} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Vue{Enter}');

    expect(onChange).toHaveBeenCalledWith(['Vue']);
  });

  it('adds a skill on comma key', async () => {
    const onChange = vi.fn();
    render(<SkillsInput value={[]} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Node,');

    expect(onChange).toHaveBeenCalledWith(['Node']);
  });

  it('removes a skill when X button is clicked', async () => {
    const onChange = vi.fn();
    render(<SkillsInput value={['React', 'Node']} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText('Remove React'));

    expect(onChange).toHaveBeenCalledWith(['Node']);
  });

  it('removes last skill on Backspace when input is empty', async () => {
    const onChange = vi.fn();
    render(<SkillsInput value={['React', 'Node']} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith(['React']);
  });

  it('does not add duplicate skills', async () => {
    const onChange = vi.fn();
    render(<SkillsInput value={['React']} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'React{Enter}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows error message when error prop is set', () => {
    render(
      <SkillsInput value={[]} onChange={() => {}} error="Too many skills" />,
    );
    expect(screen.getByText('Too many skills')).toBeInTheDocument();
  });

  it('disables input at maxSkills limit', () => {
    render(<SkillsInput value={['a', 'b']} onChange={() => {}} maxSkills={2} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
