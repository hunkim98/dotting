import { Navigation } from "../Navigation";
import * as S from "./styles";

interface Props {}

const Layout: React.FC<Props> = ({ children }) => {
  return (
    <S.Container>
      <Navigation />
      {children}
    </S.Container>
  );
};

export default Layout;
