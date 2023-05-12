import React from 'react';
import './TroubleShooting.css';

import { Link } from 'react-router-dom';

interface Props {
	show: boolean;
	skipStep?: string;
}
export const TroubleShooting: React.FC<React.PropsWithChildren<Props>> = ({
	children,
	show,
	skipStep,
}) => {
	return show ? (
		<section className="troubleshooting">
			<article>
				{children}
				<nav>
					<button
						className="button primary"
						onClick={() => window.location.reload()}>
						Reload page
					</button>
					{skipStep && (
						<Link className="link ghost" to={skipStep}>
							Skip step
						</Link>
					)}
				</nav>
			</article>
		</section>
	) : null;
};
