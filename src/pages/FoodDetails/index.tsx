import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';


interface Params {
  id: number;
}


interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}


interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}


const FoodDetails: React.FC = () => {


  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;


  useEffect(() => {

    /** Carregar um prato específico, com extras. */
    async function loadFood(): Promise<void> {
      const response = await api.get(`/foods/${routeParams.id}`);

      setFood({
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      });
      setExtras(
        response.data.extras.map((extra: Omit<Extra, 'quantity'>) => ({
          ...extra,
          quantity: 0,
        })));
    }

    loadFood();
  }, [routeParams]);


  useEffect(() => {

    /** Buscar se o prato já está na lista de favoritos. */
    async function getFavoriteStatus(): Promise<void> {
      const response = await api.get(`/favorites/${routeParams.id}`);

      if (!!response.data) {
        setIsFavorite(true);
      } else {
        setIsFavorite(false);
      }
    }

    getFavoriteStatus();
  }, [routeParams]);


  /** Incrementar a quantidade do item extra. */
  function handleIncrementExtra(id: number): void {

    setExtras(extras.map(extra => (
      extra.id === id ?
        // Incrementa se o id for o id passado como parâmetro...
        {
          ...extra,
          quantity: extra.quantity + 1,
        } :
        // ... senão, não faz nada
        extra
    )));
  }


  /** Decrementar a quantidade do item extra. */
  function handleDecrementExtra(id: number): void {

    // Procura o extra com o id passado como parâmetro
    const findExtra = extras.find(extra => extra.id === id);
    // Se não encontrou, retorna
    if (!findExtra) return;
    // Se encontrou, mas a quantidade já for zero, retorna
    if (findExtra.quantity === 0) return;
    // Só então decrementa...
    setExtras(extras.map(extra => (
      extra.id === id ?
        // ... se o id for o id passado como parâmetro...
        {
          ...extra,
          quantity: extra.quantity - 1,
        } :
        // ... senão, não faz nada
        extra
    )));
  }


  /** Incrementar a quantidade de pratos no pedido. */
  function handleIncrementFood(): void {

    setFoodQuantity(foodQuantity + 1);
  }


  /** Decrementar a quantidade de pratos no pedido. */
  function handleDecrementFood(): void {

    // Se a quantidade já for o mínimo (1), retorna
    if (foodQuantity === 1) return;
    // Caso contrário, decrementa
    setFoodQuantity(foodQuantity - 1);
  }


  /** Incluir/excluir o prato na lista de favoritos. */
  const toggleFavorite = useCallback(async () => {

    if (isFavorite) {
      // Se já é favorito, remove da lista de favoritos
      await api.delete(`/favorites/${food.id}`);
    } else {
      // Se não é favorito, inclui na lista de favoritos
      await api.post('/favorites', food);
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);


  /** Calcular o valor total do pedido. */
  const cartTotal = useMemo(() => {

    // Calcula o total dos extras (total de quantidade * preço)
    const extrasTotal = extras.reduce((accumulator, extra) => {
      return accumulator + (extra.quantity * extra.value);
    }, 0);

    // Calcula o total do prato com os extras (para o pedido de 1 quantidade)
    const foodPriceWithExtras = food.price + extrasTotal;

    // Retorna o total do prato * quantidade de pratos pedidos
    return formatValue(foodPriceWithExtras * foodQuantity);
  }, [extras, food, foodQuantity]);


  /** Fechar o pedido. */
  async function handleFinishOrder(): Promise<void> {

    // TODO
  }


  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );


  // Exibir ícone de favorito no canto superior direito do cabeçalho
  useLayoutEffect(() => {

    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);


  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>

            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>

        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>

              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />

                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>

                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>

        <TotalContainer>
          <Title>Total do pedido</Title>

          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>

            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />

              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>

              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>

            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );


};


export default FoodDetails;
