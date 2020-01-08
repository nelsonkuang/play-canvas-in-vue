/**
 * 参照 SVG <path>
 * M = moveto(M X,Y)：将画笔移动到指定的坐标位置
 * L = lineto(L X,Y)：画直线到指定的坐标位置
 * H = horizontal lineto(H X)：画水平线到指定的X坐标位置
 * V = vertical lineto(V Y)：画垂直线到指定的Y坐标位置
 * C = curveto(C X1,Y1,X2,Y2,ENDX,ENDY)：三次贝赛曲线
 * S = smooth curveto(S X2,Y2,ENDX,ENDY)：平滑曲率
 * Q = quadratic Belzier curve(Q X,Y,ENDX,ENDY)：二次贝赛曲线
 * T = smooth quadratic Belzier curveto(T ENDX,ENDY)：映射
 * A = elliptical Arc(A RX,RY,XROTATION,FLAG1,FLAG2,X,Y)：弧线
 * Z = closepath()：关闭路径
 */