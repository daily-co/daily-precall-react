import React, { useRef } from 'react';
import './TroubleShooting.css';

import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Button } from '../Button/Button';

interface Props {
	show: boolean;
	skipStep?: () => void;
}
export const TroubleShooting: React.FC<React.PropsWithChildren<Props>> = ({
	children,
	show,
	skipStep,
}) => {
	const nodeRef = useRef(null);

	return (
		<TransitionGroup>
			{show && (
				<CSSTransition
					classNames="troubleshooting-transition"
					appear={show}
					timeout={{
						exit: 0,
						enter: 1000,
					}}
					nodeRef={nodeRef}>
					<section ref={nodeRef} className="troubleshooting">
						<article>
							{children}
							<nav>
								<Button onClick={() => window.location.reload()}>
									Reload page
								</Button>
								{skipStep && (
									<Button variant="ghost" onClick={skipStep}>
										Skip step
									</Button>
								)}
							</nav>
						</article>
					</section>
				</CSSTransition>
			)}
		</TransitionGroup>
	);
};
