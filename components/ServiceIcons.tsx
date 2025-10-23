import React from 'react';

// Change prop type from SVG to IMG attributes
type IconProps = React.ImgHTMLAttributes<HTMLImageElement>;

const commonStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
};

// Some logos are rectangular and look better when they fill their container
const coverStyle: React.CSSProperties = {
    ...commonStyle,
    objectFit: 'cover',
    borderRadius: '4px'
};

export const TraktIcon: React.FC<IconProps> = (props) => (
    <img src="https://trakt.tv/assets/logos/logomark.square.gradient-b644b16c38ff775861b4b1f58c1230f6a097a2466ab33ae00445a505c33fcb91.svg" alt="Trakt Logo" style={commonStyle} {...props} />
);

export const TvdbIcon: React.FC<IconProps> = (props) => (
    <img src="https://thetvdb.com/images/logo.svg" alt="TVDB Logo" style={commonStyle} {...props} />
);

export const TmdbIcon: React.FC<IconProps> = (props) => (
    <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB Logo" style={commonStyle} {...props} />
);

export const ImdbIcon: React.FC<IconProps> = (props) => (
    <img src="https://s.yimg.com/fz/api/res/1.2/XB0O5I9RmAFryIG9tHZTmA--~C/YXBwaWQ9c3JjaGRkO2ZpPWZpdDtoPTI0MDtxPTgwO3c9MzMy/https://s.yimg.com/zb/imgv1/71e55e11-6a5f-3d09-ac34-5d62f0d53562/t_500x300" alt="IMDb Logo" style={coverStyle} {...props} />
);

export const TvTimeIcon: React.FC<IconProps> = (props) => (
    <img src="https://up.yimg.com/ib/th/id/OIP.HK7ygTzVR5RBYs3moNR3cwHaBt?pid=Api&rs=1&c=1&qlt=95&w=499&h=114" alt="TV Time Logo" style={commonStyle} {...props} />
);

export const ShowlyIcon: React.FC<IconProps> = (props) => (
    <img src="https://tse1.mm.bing.net/th/id/OIP.rhsbnef5LBTPyqrTX67UrgHaHa?pid=Api&P=0&h=180" alt="Showly Logo" style={{...commonStyle, borderRadius: '50%'}} {...props} />
);
