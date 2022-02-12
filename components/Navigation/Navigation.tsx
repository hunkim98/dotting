import Link from "next/link";
import * as S from "./styles";

interface Props {}

const Navigation: React.FC<Props> = ({}) => {
  return (
    <S.Container>
      <S.Title>DOTTING</S.Title>
      <S.Tabs>
        <Link href="/">
          <S.Tab>DOTTER</S.Tab>
        </Link>
        <Link href="/">
          <S.Tab>DOTTED</S.Tab>
        </Link>
        <Link href="/">
          <S.Tab>GAME</S.Tab>
        </Link>
      </S.Tabs>
    </S.Container>
  );
};

export default Navigation;
