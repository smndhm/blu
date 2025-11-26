import '../node_modules/normalize.css/normalize.css';
import './style.scss';
import LcsCnvs from './lcsCnvs';

if (!window.matchMedia('(prefers-reduced-motion: reduce)')?.matches) new LcsCnvs(window);
