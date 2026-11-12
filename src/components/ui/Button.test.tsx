import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from './Button';

describe('Button', () => {
  it('renders its children and defaults to type button', () => {
    render(<Button>Run tool</Button>);

    const button = screen.getByRole('button', { name: 'Run tool' });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('calls onClick', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Run tool</Button>);

    await user.click(screen.getByRole('button', { name: 'Run tool' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects the disabled state', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Run tool
      </Button>
    );

    await user.click(screen.getByRole('button', { name: 'Run tool' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
